import { ProjectCardRelationship } from "@/core/models";
import { createContext, memo, useContext, useRef, useState } from "react";

interface IStartCardSelectionProps {
    type: ProjectCardRelationship.TRelationship;
    currentUID: string;
    saveCallback: (relationships: [string, string][]) => void;
    cancelCallback: () => void;
}

export interface IBoardRelationshipControllerContext {
    selectCardViewType?: ProjectCardRelationship.TRelationship;
    selectedRelationshipUIDs: [string, string][];
    currentCardUIDRef: React.RefObject<string | null>;
    disabledCardSelectionUIDsRef: React.RefObject<string[]>;
    startCardSelection: (props: IStartCardSelectionProps) => void;
    setSelectedRelationshipCardUIDs: React.Dispatch<React.SetStateAction<[string, string][]>>;
    setCardSelection: (cardUID: string, relationshipUID?: string) => void;
    saveCardSelection: () => void;
    cancelCardSelection: () => void;
    isSelectedCard: (cardUID: string) => bool;
    isDisabledCard: (cardUID: string) => bool;
    filterRelationships: (cardUID: string, relationships: ProjectCardRelationship.TModel[], isParent: bool) => ProjectCardRelationship.TModel[];
    filterRelatedCardUIDs: (cardUID: string, relationships: ProjectCardRelationship.TModel[], isParent: bool) => string[];
}

interface IBoardRelationshipControllerProps {
    children: React.ReactNode;
}

const initialContext = {
    selectedRelationshipUIDs: [],
    currentCardUIDRef: { current: null },
    disabledCardSelectionUIDsRef: { current: [] },
    startCardSelection: () => {},
    setSelectedRelationshipCardUIDs: () => {},
    setCardSelection: () => {},
    saveCardSelection: () => {},
    cancelCardSelection: () => {},
    isSelectedCard: () => false,
    isDisabledCard: () => false,
    filterRelationships: () => [],
    filterRelatedCardUIDs: () => [],
};

const BoardRelationshipControllerContext = createContext<IBoardRelationshipControllerContext>(initialContext);

export const BoardRelationshipController = memo(({ children }: IBoardRelationshipControllerProps): React.ReactNode => {
    const [selectCardViewType, setSelectCardViewType] = useState<ProjectCardRelationship.TRelationship>();
    const [selectedRelationshipUIDs, setSelectedRelationshipCardUIDs] = useState<[string, string][]>([]);
    const currentCardUIDRef = useRef<string>(null);
    const saveCardSelectionCallbackRef = useRef<(relationships: [string, string][]) => void>(null);
    const disabledCardSelectionUIDsRef = useRef<string[]>([]);
    const cancelCardSelectionCallbackRef = useRef<() => void>(null);

    const setCardSelection = (cardUID: string, relationshipUID?: string) => {
        if (!relationshipUID) {
            setSelectedRelationshipCardUIDs((prev) => prev.filter(([selectedCardUID]) => selectedCardUID !== cardUID));
            return;
        }

        const existedSelection = selectedRelationshipUIDs.find(([selectedCardUID]) => selectedCardUID === cardUID);
        if (!existedSelection) {
            setSelectedRelationshipCardUIDs((prev) => [...prev, [cardUID, relationshipUID]]);
            return;
        } else {
            existedSelection[1] = relationshipUID;
        }
    };

    const startCardSelection = ({ type, currentUID, saveCallback, cancelCallback }: IStartCardSelectionProps) => {
        currentCardUIDRef.current = currentUID;
        saveCardSelectionCallbackRef.current = saveCallback;
        cancelCardSelectionCallbackRef.current = cancelCallback;
        setSelectCardViewType(type);
    };

    const saveCardSelection = () => {
        const selections = [...selectedRelationshipUIDs];
        setSelectCardViewType(undefined);
        setSelectedRelationshipCardUIDs([]);
        setTimeout(() => {
            saveCardSelectionCallbackRef.current?.(selections);
            clear();
        }, 0);
    };

    const cancelCardSelection = () => {
        setSelectCardViewType(undefined);
        setSelectedRelationshipCardUIDs([]);
        setTimeout(() => {
            cancelCardSelectionCallbackRef.current?.();
            clear();
        }, 0);
    };

    const isSelectedCard = (cardUID: string) => selectedRelationshipUIDs.some(([selectedCardUID]) => selectedCardUID === cardUID);
    const isDisabledCard = (cardUID: string) => disabledCardSelectionUIDsRef.current.includes(cardUID);

    const filterRelationships = (cardUID: string, relationships: ProjectCardRelationship.TModel[], isParent: bool) => {
        return relationships.filter((relationship) => (isParent ? relationship.child_card_uid : relationship.parent_card_uid) === cardUID);
    };

    const filterRelatedCardUIDs = (cardUID: string, relationships: ProjectCardRelationship.TModel[], isParent: bool) => {
        return filterRelationships(cardUID, relationships, isParent).map((relationship) =>
            isParent ? relationship.parent_card_uid : relationship.child_card_uid
        );
    };

    const clear = () => {
        saveCardSelectionCallbackRef.current = null;
        cancelCardSelectionCallbackRef.current = null;
        currentCardUIDRef.current = null;
        disabledCardSelectionUIDsRef.current = [];
    };

    return (
        <BoardRelationshipControllerContext.Provider
            value={{
                selectCardViewType,
                selectedRelationshipUIDs,
                currentCardUIDRef,
                disabledCardSelectionUIDsRef,
                startCardSelection,
                setSelectedRelationshipCardUIDs,
                setCardSelection,
                saveCardSelection,
                cancelCardSelection,
                isSelectedCard,
                isDisabledCard,
                filterRelationships,
                filterRelatedCardUIDs,
            }}
        >
            {children}
        </BoardRelationshipControllerContext.Provider>
    );
});

export const useBoardRelationshipController = () => {
    const context = useContext(BoardRelationshipControllerContext);
    if (!context) {
        throw new Error("useBoardRelationshipController must be used within a BoardRelationshipController");
    }
    return context;
};
