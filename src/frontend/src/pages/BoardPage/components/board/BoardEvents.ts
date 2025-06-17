import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import {
    BOARD_SETTINGS,
    isCardData,
    isCardDropTargetData,
    isColumnData,
    isDraggingACard,
    isDraggingAColumn,
} from "@/pages/BoardPage/components/board/BoardData";
import { unsafeOverflowAutoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element";
import { Project, ProjectCard, ProjectColumn } from "@/core/models";
import useChangeProjectColumnOrder from "@/controllers/api/board/useChangeProjectColumnOrder";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useChangeCardOrder from "@/controllers/api/board/useChangeCardOrder";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";

export interface ICreateBoardEventsProps {
    project: Project.TModel;
    columns: ProjectColumn.TModel[];
    cardsMap: Record<string, ProjectCard.TModel>;
    scrollable: HTMLDivElement;
    changeColumnOrderMutate: ReturnType<typeof useChangeProjectColumnOrder>["mutate"];
    changeCardOrderMutate: ReturnType<typeof useChangeCardOrder>["mutate"];
}

const createBoardEvents = ({ project, columns, cardsMap, scrollable, changeColumnOrderMutate, changeCardOrderMutate }: ICreateBoardEventsProps) => {
    const setupApiErrors = (error: unknown, undo: () => void) => {
        const { handle } = setupApiErrorHandler({
            code: {
                after: undo,
            },
            wildcard: {
                after: undo,
            },
        });

        handle(error);
    };

    return combine(
        monitorForElements({
            canMonitor: isDraggingACard,
            onDrop({ source, location }) {
                const dragging = source.data;
                if (!isCardData(dragging)) {
                    return;
                }

                const innerMost = location.current.dropTargets[0];
                if (!innerMost) {
                    return;
                }

                const dropTargetData = innerMost.data;
                const homeColumnIndex = columns.findIndex((column) => column.uid === dragging.card.column_uid);
                const home: ProjectColumn.TModel | undefined = columns[homeColumnIndex];
                if (!home) {
                    return;
                }

                const cardIndexInHome = dragging.card.order;

                // dropping on a card
                if (isCardDropTargetData(dropTargetData)) {
                    const destinationColumnIndex = columns.findIndex((column) => column.uid === dropTargetData.card.column_uid);
                    const destination = columns[destinationColumnIndex];
                    // reordering in home column
                    if (home === destination) {
                        const cardFinishIndex = dropTargetData.card.order;

                        // could not find cards needed
                        if (cardIndexInHome === -1 || cardFinishIndex === -1) {
                            return;
                        }

                        // no change needed
                        if (cardIndexInHome === cardFinishIndex) {
                            return;
                        }

                        const closestEdge = extractClosestEdge(dropTargetData);

                        const { undo } = reorderItemsWithEdge({
                            list: Object.values(cardsMap)
                                .filter((card) => card.column_uid === home.uid)
                                .sort((a, b) => a.order - b.order),
                            startIndex: cardIndexInHome,
                            indexOfTarget: cardFinishIndex,
                            closestEdgeOfTarget: closestEdge,
                        });

                        changeCardOrderMutate(
                            {
                                project_uid: project.uid,
                                card_uid: dragging.card.uid,
                                order: dragging.card.order,
                            },
                            { onError: (error) => setupApiErrors(error, undo) }
                        );
                        return;
                    }

                    // moving card from one column to another

                    // unable to find destination
                    if (!destination) {
                        return;
                    }

                    const indexOfTarget = cardsMap[dropTargetData.card.uid].order;
                    const closestEdge = extractClosestEdge(dropTargetData);
                    const finalIndex = closestEdge === "bottom" ? indexOfTarget + 1 : indexOfTarget;

                    const { undo } = moveCard({
                        cardsMap,
                        draggingCard: dragging.card,
                        sourceColumn: home,
                        destinationColumn: destination,
                        targetIndex: finalIndex,
                    });

                    changeCardOrderMutate(
                        {
                            project_uid: project.uid,
                            card_uid: dragging.card.uid,
                            order: dragging.card.order,
                            parent_uid: destination.uid,
                        },
                        { onError: (error) => setupApiErrors(error, undo) }
                    );
                    return;
                }

                // dropping onto a column, but not onto a card
                if (isColumnData(dropTargetData)) {
                    const destinationColumnIndex = columns.findIndex((column) => column.uid === dropTargetData.column.uid);
                    const destination = columns[destinationColumnIndex];

                    if (!destination) {
                        return;
                    }

                    // dropping on home
                    if (home === destination) {
                        const { undo } = reorderItems({
                            list: Object.values(cardsMap)
                                .filter((card) => card.column_uid === home.uid)
                                .sort((a, b) => a.order - b.order),
                            startIndex: cardIndexInHome,
                            finishIndex: "last",
                        });

                        changeCardOrderMutate(
                            {
                                project_uid: project.uid,
                                card_uid: dragging.card.uid,
                                order: dragging.card.order,
                            },
                            { onError: (error) => setupApiErrors(error, undo) }
                        );
                        return;
                    }

                    // move card from home to another column
                    const { undo } = moveCard({
                        cardsMap,
                        draggingCard: dragging.card,
                        sourceColumn: home,
                        destinationColumn: destination,
                        targetIndex: "last",
                    });

                    changeCardOrderMutate(
                        {
                            project_uid: project.uid,
                            card_uid: dragging.card.uid,
                            order: dragging.card.order,
                            parent_uid: destination.uid,
                        },
                        { onError: (error) => setupApiErrors(error, undo) }
                    );
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

                changeColumnOrderMutate(
                    { project_uid: project.uid, column_uid: dragging.column.uid, order: dragging.column.order },
                    { onError: (error) => setupApiErrors(error, undo) }
                );
            },
        }),
        autoScrollForElements({
            canScroll({ source }) {
                if (!BOARD_SETTINGS.isOverElementAutoScrollEnabled) {
                    return false;
                }

                return isDraggingACard({ source }) || isDraggingAColumn({ source });
            },
            getConfiguration: () => ({ maxScrollSpeed: BOARD_SETTINGS.boardScrollSpeed }),
            element: scrollable,
        }),
        unsafeOverflowAutoScrollForElements({
            element: scrollable,
            getConfiguration: () => ({ maxScrollSpeed: BOARD_SETTINGS.boardScrollSpeed }),
            canScroll({ source }) {
                if (!BOARD_SETTINGS.isOverElementAutoScrollEnabled) {
                    return false;
                }

                if (!BOARD_SETTINGS.isOverflowScrollingEnabled) {
                    return false;
                }

                return isDraggingACard({ source }) || isDraggingAColumn({ source });
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

const reorderItems = <TValue extends { order: number }>({
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

const reorderItemsWithEdge = <TValue extends { order: number }>({
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

const moveCard = ({
    cardsMap,
    draggingCard,
    sourceColumn,
    destinationColumn,
    targetIndex,
}: {
    cardsMap: Record<string, ProjectCard.TModel>;
    draggingCard: ProjectCard.TModel;
    sourceColumn: ProjectColumn.TModel;
    destinationColumn: ProjectColumn.TModel;
    targetIndex: number | "last";
}) => {
    const updatedCards: Record<string, [number, string | null]> = {};
    let lastIndex = 0;
    Object.values(cardsMap).forEach((card) => {
        if (card.column_uid === sourceColumn.uid && card.order > draggingCard.order) {
            updatedCards[card.uid] = [card.order, null];
            card.order -= 1;
            return;
        }

        if (card.column_uid !== destinationColumn.uid) {
            return;
        }

        if (targetIndex === "last") {
            lastIndex = Math.max(lastIndex, card.order);
            return;
        }

        if (card.order >= targetIndex) {
            updatedCards[card.uid] = [card.order, null];
            card.order += 1;
        }
    });

    updatedCards[draggingCard.uid] = [draggingCard.order, draggingCard.column_uid];
    draggingCard.order = targetIndex === "last" ? lastIndex + 1 : targetIndex;
    draggingCard.column_uid = destinationColumn.uid;

    const undo = () => {
        Object.entries(updatedCards).forEach(([cardUID, [order, columnUID]]) => {
            const card = cardsMap[cardUID];
            if (!card) {
                return;
            }

            card.order = order;
            if (columnUID) {
                card.column_uid = columnUID;
            }
        });
    };

    return {
        undo,
    };
};

export default createBoardEvents;
