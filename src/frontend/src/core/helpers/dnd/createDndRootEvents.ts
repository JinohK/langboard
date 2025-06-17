/* eslint-disable @typescript-eslint/no-explicit-any */
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { unsafeOverflowAutoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";
import { TRowModelWithKey, TSettings, TSortableData, TSymbolSet } from "@/core/helpers/dnd/types";
import createDndDataHelper from "@/core/helpers/dnd/createDndDataHelper";

export interface ICreateDndRootEventsProps<TColumnModel extends TSortableData, TRowModel extends TSortableData> {
    columns: TColumnModel[];
    rowsMap: Record<string, TRowModelWithKey<TRowModel>>;
    columnKeyInRow: keyof TRowModel;
    symbolSet: TSymbolSet;
    scrollable: HTMLElement;
    settings: TSettings;
    changeColumnOrder: (context: { columnUID: string; order: number; undo: () => void }) => void;
    changeRowOrder: (context: { rowUID: string; order: number; parentUID?: string; undo: () => void }) => void;
}

const createDndRootEvents = <TColumnModel extends TSortableData, TRowModel extends TSortableData>(
    props: ICreateDndRootEventsProps<TColumnModel, TRowModel>
) => {
    const { columns, rowsMap, columnKeyInRow, symbolSet, scrollable, settings, changeColumnOrder, changeRowOrder } = props;

    type TRow = TRowModelWithKey<TRowModel>;

    const { isColumnData, isDraggingAColumn, isRowData, isDraggingARow, isDroppableTargetData } = createDndDataHelper<TColumnModel, TRowModel>({
        symbolSet,
    });

    const getRowsByColumn = (column: TColumnModel): TRowModelWithKey<TRowModel>[] => {
        return Object.values(rowsMap)
            .filter((row) => row[columnKeyInRow] === column.uid)
            .sort((a, b) => a.order - b.order);
    };

    const reorderItems = <TValue extends TColumnModel | TRow>({
        list,
        startIndex,
        finishIndex,
    }: {
        list: TValue[];
        startIndex: number;
        finishIndex: number | "last";
    }) => {
        if (finishIndex === "last") {
            finishIndex = list.length - 1;
        }

        const reordered = reorder({ list, startIndex, finishIndex });
        console.log(list, reordered, startIndex, finishIndex);
        reordered.forEach((item, index) => {
            item.order = index;
        });

        const undo = () => {
            const undoRedorered = reorder({
                list,
                startIndex: finishIndex,
                finishIndex: startIndex,
            });
            undoRedorered.forEach((item, index) => {
                item.order = index;
            });

            return undoRedorered;
        };

        return {
            list: reordered,
            undo,
        };
    };

    const reorderItemsWithEdge = <TValue extends TColumnModel | TRow>({
        list,
        startIndex,
        indexOfTarget,
        closestEdgeOfTarget,
    }: {
        list: TValue[];
        startIndex: number;
        indexOfTarget: number;
        closestEdgeOfTarget: Edge | null;
    }) => {
        const reordered = reorderWithEdge({
            axis: "vertical",
            list,
            startIndex,
            indexOfTarget,
            closestEdgeOfTarget,
        });
        reordered.forEach((item, index) => {
            item.order = index;
        });

        const undo = () => {
            const undoReordered = reorderWithEdge({
                axis: "vertical",
                list,
                startIndex: indexOfTarget,
                indexOfTarget: startIndex,
                closestEdgeOfTarget: closestEdgeOfTarget === "top" ? "bottom" : "top",
            });
            undoReordered.forEach((item, index) => {
                item.order = index;
            });

            return undoReordered;
        };

        return {
            list: reordered,
            undo,
        };
    };

    const moveRow = ({
        draggingRow,
        sourceColumn,
        destinationColumn,
        targetIndex,
    }: {
        draggingRow: TRow;
        sourceColumn: TSortableData;
        destinationColumn: TSortableData;
        targetIndex: number | "last";
    }) => {
        const updatedCards: Record<string, [number, string | null]> = {};
        let lastIndex = 0;
        Object.values(rowsMap).forEach((row) => {
            if (row[columnKeyInRow] === sourceColumn.uid && row.order > draggingRow.order) {
                updatedCards[row.uid] = [row.order, null];
                row.order -= 1;
                return;
            }

            if (row[columnKeyInRow] !== destinationColumn.uid) {
                return;
            }

            if (targetIndex === "last") {
                lastIndex = Math.max(lastIndex, row.order);
                return;
            }

            if (row.order >= targetIndex) {
                updatedCards[row.uid] = [row.order, null];
                row.order += 1;
            }
        });

        updatedCards[draggingRow.uid] = [draggingRow.order, draggingRow[columnKeyInRow]];
        draggingRow.order = targetIndex === "last" ? lastIndex + 1 : targetIndex;
        draggingRow[columnKeyInRow] = destinationColumn.uid as any;

        const undo = () => {
            Object.entries(updatedCards).forEach(([rowUID, [order, columnUID]]) => {
                const row = rowsMap[rowUID];
                if (!row) {
                    return;
                }

                row.order = order;
                if (columnUID) {
                    row[columnKeyInRow] = columnUID as any;
                }
            });
        };

        return {
            undo,
        };
    };

    return combine(
        monitorForElements({
            canMonitor: isDraggingARow,
            onDrop({ source, location }) {
                const dragging = source.data;
                if (!isRowData(dragging)) {
                    return;
                }

                const innerMost = location.current.dropTargets[0];
                if (!innerMost) {
                    return;
                }

                const dropTargetData = innerMost.data;
                const homeColumnIndex = columns.findIndex((column) => column.uid === dragging.row[columnKeyInRow]);
                const home = columns[homeColumnIndex];
                if (!home) {
                    return;
                }

                const rowIndexInHome = dragging.row.order;

                // dropping on a row
                if (isDroppableTargetData(dropTargetData)) {
                    const destinationColumnIndex = columns.findIndex((column) => column.uid === dropTargetData.row[columnKeyInRow]);
                    const destination = columns[destinationColumnIndex];
                    // reordering in home column
                    if (home === destination) {
                        const rowFinishIndex = dropTargetData.row.order;

                        // no change needed
                        if (rowIndexInHome === rowFinishIndex) {
                            return;
                        }

                        const closestEdge = extractClosestEdge(dropTargetData);

                        const { undo } = reorderItemsWithEdge({
                            list: getRowsByColumn(home),
                            startIndex: rowIndexInHome,
                            indexOfTarget: rowFinishIndex,
                            closestEdgeOfTarget: closestEdge,
                        });

                        changeRowOrder({ rowUID: dragging.row.uid, order: dragging.row.order, undo });
                        return;
                    }

                    // moving row from one column to another

                    // unable to find destination
                    if (!destination) {
                        return;
                    }

                    const indexOfTarget = rowsMap[dropTargetData.row.uid].order;
                    const closestEdge = extractClosestEdge(dropTargetData);
                    const finalIndex = closestEdge === "bottom" ? indexOfTarget + 1 : indexOfTarget;

                    const { undo } = moveRow({
                        draggingRow: dragging.row,
                        sourceColumn: home,
                        destinationColumn: destination,
                        targetIndex: finalIndex,
                    });

                    changeRowOrder({ rowUID: dragging.row.uid, order: dragging.row.order, parentUID: destination.uid, undo });
                    return;
                }

                // dropping onto a column, but not onto a row
                if (isColumnData(dropTargetData)) {
                    const destinationColumnIndex = columns.findIndex((column) => column.uid === dropTargetData.column.uid);
                    const destination = columns[destinationColumnIndex];

                    if (!destination) {
                        return;
                    }

                    // dropping on home
                    if (home === destination) {
                        const { undo } = reorderItems({
                            list: getRowsByColumn(home),
                            startIndex: rowIndexInHome,
                            finishIndex: "last",
                        });

                        changeRowOrder({ rowUID: dragging.row.uid, order: dragging.row.order, undo });
                        return;
                    }

                    // move row from home to another column
                    const { undo } = moveRow({
                        draggingRow: dragging.row,
                        sourceColumn: home,
                        destinationColumn: destination,
                        targetIndex: "last",
                    });

                    changeRowOrder({ rowUID: dragging.row.uid, order: dragging.row.order, parentUID: destination.uid, undo });
                    return;
                }
            },
        }),
        monitorForElements({
            canMonitor: isDraggingAColumn,
            onDrop({ source, location }) {
                const dragging = source.data;
                if (!isColumnData(dragging)) {
                    return;
                }

                const innerMost = location.current.dropTargets[0];
                if (!innerMost) {
                    return;
                }

                const dropTargetData = innerMost.data;

                if (!isColumnData(dropTargetData)) {
                    return;
                }

                const homeIndex = dragging.column.order;
                const destinationIndex = dropTargetData.column.order;
                if (homeIndex === destinationIndex) {
                    return;
                }

                const { undo } = reorderItems({
                    list: columns,
                    startIndex: homeIndex,
                    finishIndex: destinationIndex,
                });

                changeColumnOrder({ columnUID: dragging.column.uid, order: dragging.column.order, undo });
            },
        }),
        autoScrollForElements({
            canScroll({ source }) {
                if (!settings.isOverElementAutoScrollEnabled) {
                    return false;
                }

                return isDraggingARow({ source }) || isDraggingAColumn({ source });
            },
            getConfiguration: () => ({ maxScrollSpeed: settings.rootScrollSpeed }),
            element: scrollable,
        }),
        unsafeOverflowAutoScrollForElements({
            element: scrollable,
            getConfiguration: () => ({ maxScrollSpeed: settings.rootScrollSpeed }),
            canScroll({ source }) {
                if (!settings.isOverElementAutoScrollEnabled) {
                    return false;
                }

                if (!settings.isOverflowScrollingEnabled) {
                    return false;
                }

                return isDraggingARow({ source }) || isDraggingAColumn({ source });
            },
            getOverflow() {
                return {
                    forLeftEdge: {
                        top: 1000,
                        left: 1000,
                        bottom: 1000,
                    },
                    forRightEdge: {
                        top: 1000,
                        right: 1000,
                        bottom: 1000,
                    },
                };
            },
        })
    );
};

export default createDndRootEvents;
