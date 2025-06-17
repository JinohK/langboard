/* eslint-disable @typescript-eslint/no-explicit-any */

import { TColumnData, TColumnState, TDroppableTargetData, TRowData, TRowModelWithKey, TSortableData, TSymbolSet } from "@/core/helpers/dnd/types";
import TypeUtils from "@/core/utils/TypeUtils";
import { DragLocationHistory } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";

export interface ICreateHelperProps {
    symbolSet: TSymbolSet;
    setColumnState?: React.Dispatch<React.SetStateAction<TColumnState>>;
}

const createDndDataHelper = <TColumnModel extends TSortableData, TRowModel extends TSortableData>(props: ICreateHelperProps) => {
    type TColumn = TColumnData<TColumnModel>;
    type TRow = TRowData<TRowModel, TRowModelWithKey<TRowModel>>;
    type TDroppableTarget = TDroppableTargetData<TRowModel, TRowModelWithKey<TRowModel>>;

    const { symbolSet, setColumnState } = props;
    const { column, row, droppable } = symbolSet;

    const isColumnData = (value: any): value is TColumn => {
        return Boolean(value[column]);
    };

    const isDraggingAColumn = ({ source }: { source: { data: Record<string | symbol, unknown> } }): boolean => {
        return isColumnData(source.data);
    };

    const isRowData = (value: any): value is TRow => {
        return Boolean(value[row]);
    };

    const isDraggingARow = ({ source }: { source: { data: Record<string | symbol, unknown> } }): boolean => {
        return isRowData(source.data);
    };

    const isDroppableTargetData = (value: any): value is TDroppableTarget => {
        return Boolean(value[droppable]);
    };

    const setIsRowOver = ({ data, location }: { data: TRow; location: DragLocationHistory }) => {
        const innerMost = location.current.dropTargets[0];
        const isOverChildRow = Boolean(innerMost && isDroppableTargetData(innerMost.data));

        const proposed: TColumnState = {
            type: "is-row-over",
            dragging: data.rect,
            isOverChildRow,
        };
        // optimization - don't update state if we don't need to.
        setColumnState?.((current) => {
            if (TypeUtils.isShallowEqual(proposed, current)) {
                return current;
            }
            return proposed;
        });
    };

    return {
        isColumnData,
        isDraggingAColumn,
        isRowData,
        isDraggingARow,
        isDroppableTargetData,
        setIsRowOver,
    };
};

export default createDndDataHelper;
