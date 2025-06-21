/* eslint-disable @typescript-eslint/no-explicit-any */

import { TRowData, TRowModelWithKey, TSingleSymbolSet, TSortableData } from "@/core/helpers/dnd/types";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";

export interface ICreateDndSingleHelperProps {
    symbolSet: TSingleSymbolSet;
    isHorizontal?: bool;
}

const createDndSingleDataHelper = <TRowModel extends TSortableData>(props: ICreateDndSingleHelperProps) => {
    type TRow = TRowData<TRowModel, TRowModelWithKey<TRowModel>>;

    const { symbolSet, isHorizontal } = props;
    const { root, row } = symbolSet;

    const isRowData = (value: any): value is TRow => {
        return Boolean(value[root]) && Boolean(value[row]);
    };

    const isDraggingARow = ({ source }: { source: { data: Record<string | symbol, unknown> } }): boolean => {
        return isRowData(source.data);
    };

    const shouldHideIndicator = (originalOrder: number, newOrder: number, closestEdge: Edge): bool => {
        const isItemBeforeSource = originalOrder === newOrder - 1;
        const isItemAfterSource = originalOrder === newOrder + 1;

        if (isHorizontal) {
            // For horizontal dragging, we only hide the indicator if the closest edge is "left" or "right"
            return (isItemBeforeSource && closestEdge === "right") || (isItemAfterSource && closestEdge === "left");
        }

        const isDropIndicatorHidden = (isItemBeforeSource && closestEdge === "bottom") || (isItemAfterSource && closestEdge === "top");

        return isDropIndicatorHidden;
    };

    return {
        isRowData,
        isDraggingARow,
        shouldHideIndicator,
    };
};

export default createDndSingleDataHelper;
