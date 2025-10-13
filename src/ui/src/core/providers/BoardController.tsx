import { TDashboardStyledLayoutProps } from "@/components/Layout/DashboardStyledLayout";
import { ProjectCardRelationship } from "@/core/models";
import { createContext, memo, useContext, useRef, useState } from "react";

export type TBoardViewType = "board" | "card" | "wiki" | "settings";

interface IStartCardSelectionProps {
    type: ProjectCardRelationship.TRelationship;
    currentUID: string;
    saveCallback: (relationships: [string, string][]) => void;
    cancelCallback: () => void;
}

export interface IBoardControllerContext {
    boardViewType: TBoardViewType;
    selectCardViewType?: ProjectCardRelationship.TRelationship;
    selectedRelationshipUIDs: [string, string][];
    currentCardUIDRef: React.RefObject<string | null>;
    disabledCardSelectionUIDsRef: React.RefObject<string[]>;
    chatResizableSidebar: TDashboardStyledLayoutProps["resizableSidebar"];
    chatSidebarRef: React.RefObject<HTMLDivElement | null>;
    setBoardViewType: React.Dispatch<React.SetStateAction<TBoardViewType>>;
    startCardSelection: (props: IStartCardSelectionProps) => void;
    setSelectedRelationshipCardUIDs: React.Dispatch<React.SetStateAction<[string, string][]>>;
    setCardSelection: (cardUID: string, relationshipUID?: string) => void;
    saveCardSelection: () => void;
    cancelCardSelection: () => void;
    isSelectedCard: (cardUID: string) => bool;
    isDisabledCard: (cardUID: string) => bool;
    filterRelationships: (cardUID: string, relationships: ProjectCardRelationship.TModel[], isParent: bool) => ProjectCardRelationship.TModel[];
    filterRelatedCardUIDs: (cardUID: string, relationships: ProjectCardRelationship.TModel[], isParent: bool) => string[];
    setChatResizableSidebar: React.Dispatch<React.SetStateAction<TDashboardStyledLayoutProps["resizableSidebar"]>>;
}

interface IBoardControllerProps {
    children: React.ReactNode;
}

const initialContext = {
    boardViewType: "board" as const,
    selectedRelationshipUIDs: [],
    currentCardUIDRef: { current: null },
    disabledCardSelectionUIDsRef: { current: [] },
    chatResizableSidebar: undefined,
    chatSidebarRef: { current: null },
    setBoardViewType: () => {},
    startCardSelection: () => {},
    setSelectedRelationshipCardUIDs: () => {},
    setCardSelection: () => {},
    saveCardSelection: () => {},
    cancelCardSelection: () => {},
    isSelectedCard: () => false,
    isDisabledCard: () => false,
    filterRelationships: () => [],
    filterRelatedCardUIDs: () => [],
    setChatResizableSidebar: () => {},
};

const BoardControllerContext = createContext<IBoardControllerContext>(initialContext);

export const BoardController = memo(({ children }: IBoardControllerProps): React.ReactNode => {
    const [boardViewType, setBoardViewType] = useState<TBoardViewType>("board");
    const [selectCardViewType, setSelectCardViewType] = useState<ProjectCardRelationship.TRelationship>();
    const [selectedRelationshipUIDs, setSelectedRelationshipCardUIDs] = useState<[string, string][]>([]);
    const [chatResizableSidebar, setChatResizableSidebar] = useState<TDashboardStyledLayoutProps["resizableSidebar"]>();
    const currentCardUIDRef = useRef<string>(null);
    const saveCardSelectionCallbackRef = useRef<(relationships: [string, string][]) => void>(null);
    const disabledCardSelectionUIDsRef = useRef<string[]>([]);
    const cancelCardSelectionCallbackRef = useRef<() => void>(null);
    const chatSidebarRef = useRef<HTMLDivElement>(null);

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
        <BoardControllerContext.Provider
            value={{
                boardViewType,
                selectCardViewType,
                selectedRelationshipUIDs,
                currentCardUIDRef,
                disabledCardSelectionUIDsRef,
                chatResizableSidebar,
                chatSidebarRef,
                setBoardViewType,
                startCardSelection,
                setSelectedRelationshipCardUIDs,
                setCardSelection,
                saveCardSelection,
                cancelCardSelection,
                isSelectedCard,
                isDisabledCard,
                filterRelationships,
                filterRelatedCardUIDs,
                setChatResizableSidebar,
            }}
        >
            {children}
        </BoardControllerContext.Provider>
    );
});

export const useBoardController = () => {
    const context = useContext(BoardControllerContext);
    if (!context) {
        throw new Error("useBoardController must be used within a BoardController");
    }
    return context;
};
