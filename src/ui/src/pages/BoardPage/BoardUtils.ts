import createDndDroppableAreaDataHelper from "@/core/helpers/dnd/createDndDroppableAreaDataHelper";
import { TDroppableArea } from "@/core/helpers/dnd/types";
import { TOrderableModel, TOrderableModelName } from "@/core/models/ModelRegistry";
import { BOARD_DND_SYMBOL_SET } from "@/pages/BoardPage/components/board/BoardConstants";
import { BOARD_WIKI_DND_SYMBOL_SET } from "@/pages/BoardPage/components/wiki/WikiConstants";

export interface ICreateBoardDroppableAreaProps<
    TColumn extends TOrderableModel<TOrderableModelName>,
    TRow extends TOrderableModel<TOrderableModelName> = TColumn,
> {
    chatSidebarRef: React.RefObject<HTMLDivElement | null>;
    onDropInChatSidebar?: (model: TColumn | TRow) => void;
}

export const createBoardDroppableArea = <
    TColumn extends TOrderableModel<TOrderableModelName>,
    TRow extends TOrderableModel<TOrderableModelName> = TColumn,
>(
    props: ICreateBoardDroppableAreaProps<TColumn, TRow>
): TDroppableArea<TColumn, TRow>[] => {
    if (!props.chatSidebarRef.current) {
        return [];
    }

    return [createChatDroppableArea(props)] satisfies TDroppableArea<TColumn, TRow>[];
};

const createChatDroppableArea = <TColumn extends TOrderableModel<TOrderableModelName>, TRow extends TOrderableModel<TOrderableModelName> = TColumn>({
    chatSidebarRef,
    onDropInChatSidebar,
}: ICreateBoardDroppableAreaProps<TColumn, TRow>) => {
    const columnSymbolSet = [BOARD_DND_SYMBOL_SET.column, BOARD_DND_SYMBOL_SET.columnDroppable];
    const rowSymbolSet = [BOARD_DND_SYMBOL_SET.row, BOARD_DND_SYMBOL_SET.rowDroppable, BOARD_WIKI_DND_SYMBOL_SET.row];

    return {
        target: chatSidebarRef.current!,
        allowedType: "all",
        columnSymbolSet,
        rowSymbolSet,
        areaSymbol: Symbol("chat-sidebar-area"),
        targetSymbol: Symbol("chat-sidebar-area-target"),
        onDrop: (data) => {
            const helper = createDndDroppableAreaDataHelper<TColumn, TRow>({
                columnSymbolSet,
                rowSymbolSet,
            });

            if (helper.isRowData(data)) {
                onDropInChatSidebar?.(data.row);
                return;
            } else if (helper.isColumnData(data)) {
                onDropInChatSidebar?.(data.column);
            }
        },
    } satisfies TDroppableArea<TColumn, TRow>;
};
