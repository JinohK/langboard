/* eslint-disable @typescript-eslint/no-explicit-any */

import { TColumnData, TColumnState, TRowDroppableTargetData, TRowData, TColumnRowSymbolSet } from "@/core/helpers/dnd/types";
import { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import { TOrderableModel, TOrderableModelName } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";

export interface ICreateDndColumnRowHelperProps {
    symbolSet: TColumnRowSymbolSet;
    setColumnState?: React.Dispatch<React.SetStateAction<TColumnState>>;
}

const createDndColumnRowDataHelper = <
    TColumnModel extends TOrderableModel<TOrderableModelName>,
    TRowModel extends TOrderableModel<TOrderableModelName>,
>(
    props: ICreateDndColumnRowHelperProps
) => {
    type TColumn = TColumnData<TColumnModel>;
    type TRowDroppableTarget = TRowDroppableTargetData<TRowModel>;
    type TRow = TRowData<TRowModel>;

    const { symbolSet, setColumnState } = props;
    const { column, columnDroppable, row, rowDroppable } = symbolSet;

    const isColumnData = (value: any): value is TColumn => {
        return Boolean(value[column]);
    };

    const isDraggingAColumn = ({ source }: { source: { data: Record<string | symbol, unknown> } }): bool => {
        return isColumnData(source.data);
    };

    const isColumnDroppableTargetData = (value: any): value is TColumn => {
        return Boolean(value[columnDroppable]);
    };

    const isRowData = (value: any): value is TRow => {
        return Boolean(value[row]);
    };

    const isDraggingARow = ({ source }: { source: { data: Record<string | symbol, unknown> } }): bool => {
        return isRowData(source.data);
    };

    const isRowDroppableTargetData = (value: any): value is TRowDroppableTarget => {
        return Boolean(value[rowDroppable]);
    };

    const setIsRowOver = ({ data, location }: { data: TRow; location: DragLocationHistory }) => {
        const innerMost = location.current.dropTargets[0];
        const isOverChildRow = Boolean(innerMost && isRowDroppableTargetData(innerMost.data));

        const proposed: TColumnState = {
            type: "is-row-over",
            dragging: data.rect,
            isOverChildRow,
        };
        // optimization - don't update state if we don't need to.
        setColumnState?.((current) => {
            if (Utils.Object.isShallowEqual(proposed, current)) {
                return current;
            }
            return proposed;
        });
    };

    const shouldHideIndicator = (originalOrder: number, newOrder: number, closestEdge: Edge): bool => {
        const isItemBeforeSource = originalOrder === newOrder - 1;
        const isItemAfterSource = originalOrder === newOrder + 1;

        const isDropIndicatorHidden = (isItemBeforeSource && closestEdge === "bottom") || (isItemAfterSource && closestEdge === "top");

        return isDropIndicatorHidden;
    };

    return {
        isColumnData,
        isDraggingAColumn,
        isColumnDroppableTargetData,
        isRowData,
        isDraggingARow,
        isRowDroppableTargetData,
        setIsRowOver,
        shouldHideIndicator,
    };
};

export default createDndColumnRowDataHelper;
