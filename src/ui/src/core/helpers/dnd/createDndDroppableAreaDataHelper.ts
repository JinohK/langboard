/* eslint-disable @typescript-eslint/no-explicit-any */
import { TColumnData, TRowData, TDroppableAreaState, TDroppableArea, TDroppableAreaData } from "@/core/helpers/dnd/types";
import { TOrderableModel, TOrderableModelName } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";

export interface ICreateDndDroppableAreaHelperProps<
    TColumnModel extends TOrderableModel<TOrderableModelName>,
    TRowModel extends TOrderableModel<TOrderableModelName>,
> {
    columnSymbolSet?: symbol[];
    rowSymbolSet?: symbol[];
    droppableAreas?: TDroppableArea<TColumnModel, TRowModel>[];
    setDroppableAreaState?: React.Dispatch<React.SetStateAction<TDroppableAreaState>>;
}

const createDndDroppableAreaDataHelper = <
    TColumnModel extends TOrderableModel<TOrderableModelName>,
    TRowModel extends TOrderableModel<TOrderableModelName> = TColumnModel,
>(
    props: ICreateDndDroppableAreaHelperProps<TColumnModel, TRowModel>
) => {
    type TColumn = TColumnData<TColumnModel>;
    type TRow = TRowData<TRowModel>;

    const { columnSymbolSet, rowSymbolSet, droppableAreas, setDroppableAreaState } = props;

    const isColumnData = (value: any): value is TColumn => {
        return columnSymbolSet?.some((columnSymbol) => Boolean(value[columnSymbol])) || false;
    };

    const isRowData = (value: any): value is TRow => {
        return rowSymbolSet?.some((rowSymbol) => Boolean(value[rowSymbol])) || false;
    };

    const isDroppableAreaData = (value: any): value is TDroppableAreaData => {
        if (!droppableAreas) {
            return false;
        }
        return droppableAreas.some((area) => Boolean(value[area.areaSymbol]));
    };

    const isDroppableAreaTargetData = (value: any): bool => {
        if (!droppableAreas) {
            return false;
        }
        return droppableAreas.some((area) => Boolean(value[area.targetSymbol]));
    };

    const setIsRowOver = ({ data }: { data: TRow }) => {
        const proposed: TDroppableAreaState = {
            type: "is-row-over",
            dragging: data.rect,
        };

        // optimization - don't update state if we don't need to.
        setDroppableAreaState?.((current) => {
            if (Utils.Object.isShallowEqual(proposed, current)) {
                return current;
            }
            return proposed;
        });
    };

    return {
        isColumnData,
        isRowData,
        isDroppableAreaData,
        isDroppableAreaTargetData,
        setIsRowOver,
    };
};

export default createDndDroppableAreaDataHelper;
