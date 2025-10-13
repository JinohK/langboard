/* eslint-disable @typescript-eslint/no-explicit-any */
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { TDroppableAreaState, TColumnRowSettings, TDroppableAreaData, TDroppableAreaTargetData, TDroppableArea } from "@/core/helpers/dnd/types";
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { TOrderableModel, TOrderableModelName } from "@/core/models/ModelRegistry";
import { autoScrollForElements } from "@/core/helpers/dnd/auto-scroll/entry-point/element";
import { unsafeOverflowAutoScrollForElements } from "@/core/helpers/dnd/auto-scroll/entry-point/unsafe-overflow/element";
import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import createDndDroppableAreaDataHelper from "@/core/helpers/dnd/createDndDroppableAreaDataHelper";

export const DROPPABLE_AREA_IDLE = { type: "idle" } satisfies TDroppableAreaState;

export interface ICreateDndDroppableAreaEventsProps<
    TColumnModel extends TOrderableModel<TOrderableModelName>,
    TRowModel extends TOrderableModel<TOrderableModelName>,
> {
    droppableAreas: TDroppableArea<TColumnModel, TRowModel>[];
    scrollable?: HTMLElement;
    settings: TColumnRowSettings;
    setState: React.Dispatch<React.SetStateAction<TDroppableAreaState>>;
}

const createDndDroppableAreaEvents = <
    TColumnModel extends TOrderableModel<TOrderableModelName>,
    TRowModel extends TOrderableModel<TOrderableModelName>,
>(
    props: ICreateDndDroppableAreaEventsProps<TColumnModel, TRowModel>
) => {
    const { droppableAreas, scrollable, settings, setState } = props;

    const getDroppableAreaData = (context: TDroppableAreaData & { areaSymbol: symbol }): TDroppableAreaData => {
        return {
            [context.areaSymbol]: true,
            rect: context.rect,
            target: context.target,
        };
    };

    const getDroppableAreaTargetData = (context: TDroppableAreaTargetData & { targetSymbol: symbol }): TDroppableAreaTargetData => {
        return {
            [context.targetSymbol]: true,
            target: context.target,
        };
    };

    const cleanups: CleanupFn[] = [];
    droppableAreas.forEach(({ target, allowedType, columnSymbolSet, rowSymbolSet, areaSymbol, targetSymbol, onDrop }) => {
        const { isColumnData, isRowData, setIsRowOver } = createDndDroppableAreaDataHelper<TColumnModel, TRowModel>({
            columnSymbolSet,
            rowSymbolSet,
            droppableAreas,
            setDroppableAreaState: setState,
        });

        cleanups.push(
            dropTargetForElements({
                element: target,
                getIsSticky: () => true,
                getData: ({ element, input, source }) => {
                    if (isColumnData(source.data)) {
                        return getDroppableAreaData({ target: element, rect: element.getBoundingClientRect(), areaSymbol });
                    }

                    const data = getDroppableAreaTargetData({ target: element, targetSymbol });
                    return attachClosestEdge(data, {
                        element: target,
                        input,
                        allowedEdges: ["left", "right", "top", "bottom"],
                    });
                },
                onDragEnter({ source }) {
                    const canDropColumn = allowedType === "all" || allowedType === "column";
                    const canDropRow = allowedType === "all" || allowedType === "row";

                    if (canDropRow && isRowData(source.data)) {
                        setIsRowOver({ data: source.data });
                        return;
                    }

                    if (canDropColumn && isColumnData(source.data)) {
                        setState({ type: "is-column-over", dragging: source.data.rect });
                    }
                },
                onDropTargetChange({ source }) {
                    const canDropColumn = allowedType === "all" || allowedType === "column";
                    const canDropRow = allowedType === "all" || allowedType === "row";

                    if (canDropRow && isRowData(source.data)) {
                        setIsRowOver({ data: source.data });
                        return;
                    }

                    if (canDropColumn && isColumnData(source.data)) {
                        setState({ type: "is-column-over", dragging: source.data.rect });
                    }
                },
                onDragLeave() {
                    setState(DROPPABLE_AREA_IDLE);
                },
                onDrop({ source }) {
                    const canDropColumn = allowedType === "all" || allowedType === "column";
                    const canDropRow = allowedType === "all" || allowedType === "row";

                    if ((canDropRow && isRowData(source.data)) || (canDropColumn && isColumnData(source.data))) {
                        onDrop?.(source.data as any);
                    }

                    setState(DROPPABLE_AREA_IDLE);
                },
            })
        );

        if (scrollable) {
            cleanups.push(
                autoScrollForElements({
                    canScroll({ source }) {
                        if (!settings.isOverElementAutoScrollEnabled) {
                            return false;
                        }

                        return isRowData(source.data) || isColumnData(source.data);
                    },
                    getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
                    element: scrollable,
                }),
                unsafeOverflowAutoScrollForElements({
                    element: scrollable,
                    getConfiguration: () => ({ maxScrollSpeed: settings.columnScrollSpeed }),
                    canScroll({ source }) {
                        if (!settings.isOverElementAutoScrollEnabled) {
                            return false;
                        }

                        if (!settings.isOverflowScrollingEnabled) {
                            return false;
                        }

                        return isRowData(source.data) || isColumnData(source.data);
                    },
                    getOverflow() {
                        return {
                            forTopEdge: {
                                top: 1000,
                            },
                            forBottomEdge: {
                                bottom: 1000,
                            },
                        };
                    },
                })
            );
        }
    });

    return combine(...cleanups);
};

export default createDndDroppableAreaEvents;
