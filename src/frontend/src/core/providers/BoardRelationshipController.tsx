import { GlobalRelationshipType, ProjectCardRelationship } from "@/core/models";
import { createContext, memo, useContext, useRef, useState } from "react";

interface IStartCardSelectionProps {
    type: ProjectCardRelationship.TRelationship;
    currentUID: string;
    globalRelationshipTypes: GlobalRelationshipType.TModel[];
    saveCallback: (relationships: [string, string][]) => void;
    cancelCallback: () => void;
}

export interface IBoardRelationshipControllerContext {
    selectCardViewType?: ProjectCardRelationship.TRelationship;
    selectedRelationshipUIDs: [string, string][];
    globalRelationshipTypesRef: React.MutableRefObject<GlobalRelationshipType.TModel[]>;
    currentCardUIDRef: React.MutableRefObject<string | undefined>;
    disabledCardSelectionUIDsRef: React.MutableRefObject<string[]>;
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
    globalRelationshipTypesRef: { current: [] },
    currentCardUIDRef: { current: undefined },
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
    const currentCardUIDRef = useRef<string>();
    const globalRelationshipTypesRef = useRef<GlobalRelationshipType.TModel[]>([]);
    const saveCardSelectionCallbackRef = useRef<(relationships: [string, string][]) => void>();
    const disabledCardSelectionUIDsRef = useRef<string[]>([]);
    const cancelCardSelectionCallbackRef = useRef<() => void>();

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

    const startCardSelection = ({ type, currentUID, globalRelationshipTypes, saveCallback, cancelCallback }: IStartCardSelectionProps) => {
        currentCardUIDRef.current = currentUID;
        globalRelationshipTypesRef.current = globalRelationshipTypes;
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
        saveCardSelectionCallbackRef.current = undefined;
        cancelCardSelectionCallbackRef.current = undefined;
        currentCardUIDRef.current = undefined;
        disabledCardSelectionUIDsRef.current = [];
    };

    return (
        <BoardRelationshipControllerContext.Provider
            value={{
                selectCardViewType,
                selectedRelationshipUIDs,
                globalRelationshipTypesRef,
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
