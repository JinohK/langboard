import { GlobalRelationshipType } from "@/core/models";
import { createContext, memo, useContext, useRef, useState } from "react";

interface IStartCardSelectionProps {
    type: "parents" | "children";
    currentUID: string;
    globalRelationshipTypes: GlobalRelationshipType.Interface[];
    saveCallback: (relationships: [string, string][]) => void;
    cancelCallback: () => void;
}

export interface IBoardRelationshipControllerContext {
    selectCardViewType?: "parents" | "children";
    selectedRelationshipUIDs: [string, string][];
    globalRelationshipTypesRef: React.MutableRefObject<GlobalRelationshipType.Interface[]>;
    currentCardUIDRef: React.MutableRefObject<string | undefined>;
    disabledCardSelectionUIDsRef: React.MutableRefObject<string[]>;
    startCardSelection: (props: IStartCardSelectionProps) => void;
    setSelectedRelationshipUIDs: React.Dispatch<React.SetStateAction<[string, string][]>>;
    setCardSelection: (cardUID: string, relationshipUID?: string) => void;
    saveCardSelection: () => void;
    cancelCardSelection: () => void;
    isSelectedCard: (cardUID: string) => bool;
    isDisabledCard: (cardUID: string) => bool;
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
    setSelectedRelationshipUIDs: () => {},
    setCardSelection: () => {},
    saveCardSelection: () => {},
    cancelCardSelection: () => {},
    isSelectedCard: () => false,
    isDisabledCard: () => false,
};

const BoardRelationshipControllerContext = createContext<IBoardRelationshipControllerContext>(initialContext);

export const BoardRelationshipController = memo(({ children }: IBoardRelationshipControllerProps): React.ReactNode => {
    const [selectCardViewType, setSelectCardViewType] = useState<"parents" | "children">();
    const [selectedRelationshipUIDs, setSelectedRelationshipUIDs] = useState<[string, string][]>([]);
    const currentCardUIDRef = useRef<string>();
    const globalRelationshipTypesRef = useRef<GlobalRelationshipType.Interface[]>([]);
    const saveCardSelectionCallbackRef = useRef<(relationships: [string, string][]) => void>();
    const disabledCardSelectionUIDsRef = useRef<string[]>([]);
    const cancelCardSelectionCallbackRef = useRef<() => void>();

    const setCardSelection = (cardUID: string, relationshipUID?: string) => {
        if (!relationshipUID) {
            setSelectedRelationshipUIDs((prev) => prev.filter(([selectedCardUID]) => selectedCardUID !== cardUID));
            return;
        }

        const existedSelection = selectedRelationshipUIDs.find(([selectedCardUID]) => selectedCardUID === cardUID);
        if (!existedSelection) {
            setSelectedRelationshipUIDs((prev) => [...prev, [cardUID, relationshipUID]]);
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
        setSelectedRelationshipUIDs([]);
        setTimeout(() => {
            saveCardSelectionCallbackRef.current?.(selections);
            clear();
        }, 0);
    };

    const cancelCardSelection = () => {
        setSelectCardViewType(undefined);
        setSelectedRelationshipUIDs([]);
        setTimeout(() => {
            cancelCardSelectionCallbackRef.current?.();
            clear();
        }, 0);
    };

    const isSelectedCard = (cardUID: string) => selectedRelationshipUIDs.some(([selectedCardUID]) => selectedCardUID === cardUID);
    const isDisabledCard = (cardUID: string) => disabledCardSelectionUIDsRef.current.includes(cardUID);

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
                setSelectedRelationshipUIDs,
                setCardSelection,
                saveCardSelection,
                cancelCardSelection,
                isSelectedCard,
                isDisabledCard,
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
