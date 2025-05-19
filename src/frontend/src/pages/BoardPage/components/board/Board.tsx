import { Box, Button, Flex, ScrollArea, Toast } from "@/components/base";
import useChangeProjectColumnOrder from "@/controllers/api/board/useChangeProjectColumnOrder";
import useGetCards from "@/controllers/api/board/useGetCards";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import { ROUTES } from "@/core/routing/constants";
import BoardColumnCard, { IBoardColumnCardProps } from "@/pages/BoardPage/components/board/BoardColumnCard";
import BoardColumn, { IBoardColumnProps, SkeletonBoardColumn } from "@/pages/BoardPage/components/board/BoardColumn";
import BoardFilter, { SkeletonBoardFilter } from "@/pages/BoardPage/components/board/BoardFilter";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { memo, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { NavigateFunction } from "react-router-dom";
import { BoardProvider, useBoard } from "@/core/providers/BoardProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import BoardMemberList from "@/pages/BoardPage/components/board/BoardMemberList";
import { AuthUser, Project } from "@/core/models";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardColumnAdd from "@/pages/BoardPage/components/board/BoardColumnAdd";
import useGrabbingScrollHorizontal from "@/core/hooks/useGrabbingScrollHorizontal";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";

export function SkeletonBoard() {
    const [cardCounts, setCardCounts] = useState([1, 3, 2]);

    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;

        const updateCardCounts = () => {
            setCardCounts((prev) => {
                return prev.map((count) => {
                    if (count === 1) {
                        count = 3;
                    } else if (count === 3) {
                        count = 2;
                    } else {
                        count = 1;
                    }

                    return count;
                });
            });
        };

        timeout = setTimeout(updateCardCounts, 2000);

        return () => {
            clearTimeout(timeout!);
            timeout = null;
        };
    }, []);

    return (
        <>
            <Flex justify="between" px="4" pt="4" wrap>
                <SkeletonUserAvatarList count={6} size={{ initial: "sm", xs: "default" }} spacing="none" />
                <Flex items="center" gap="1">
                    <SkeletonBoardFilter />
                </Flex>
            </Flex>

            <Box position="relative" h="full" className="max-h-[calc(100vh_-_theme(spacing.28)_-_theme(spacing.2))] overflow-hidden">
                <Box size="full" className="rounded-[inherit]">
                    <Flex direction="row" items="start" gap="10" p="4">
                        {cardCounts.map((count) => (
                            <SkeletonBoardColumn key={createShortUUID()} cardCount={count} />
                        ))}
                    </Flex>
                </Box>
            </Box>
        </>
    );
}

export interface IBoardProps {
    navigate: NavigateFunction;
    project: Project.TModel;
    currentUser: AuthUser.TModel;
}

const Board = memo(({ navigate, project, currentUser }: IBoardProps) => {
    const { data, error } = useGetCards({ project_uid: project.uid });
    const [t] = useTranslation();

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found."));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return (
        <>
            {!data ? (
                <SkeletonBoard />
            ) : (
                <BoardProvider navigate={navigate} project={project} currentUser={currentUser}>
                    <BoardResult />
                </BoardProvider>
            )}
        </>
    );
});
Board.displayName = "Board";

const BoardResult = memo(() => {
    const { selectCardViewType, selectedRelationshipUIDs, saveCardSelection, cancelCardSelection } = useBoardRelationshipController();
    const { project, columns: flatColumns, socket, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const { columns, reorder: reorderColumns } = useReorderColumn({
        type: "ProjectColumn",
        topicId: project.uid,
        eventNameParams: { uid: project.uid },
        columns: flatColumns,
        socket,
    });
    const columnUIDs = useMemo(() => columns.map((col) => col.uid), [columns]);
    const dndContextId = useId();
    const viewportId = `board-viewport-${project.uid}`;
    const { onPointerDown } = useGrabbingScrollHorizontal(viewportId);
    const { mutate: changeProjectColumnOrderMutate } = useChangeProjectColumnOrder();
    const {
        activeColumn,
        activeRow: activeCard,
        containerIdRowDragCallbacksRef: callbacksRef,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOverOrMove,
    } = useColumnRowSortable<IBoardColumnProps["column"], IBoardColumnCardProps["card"]>({
        columnDragDataType: "Column",
        rowDragDataType: "Card",
        columnCallbacks: {
            onDragEnd: (originalColumn, index) => {
                const originalColumnOrder = originalColumn.order;
                if (!reorderColumns(originalColumn, index)) {
                    return;
                }

                changeProjectColumnOrderMutate(
                    { project_uid: project.uid, column_uid: originalColumn.uid, order: index },
                    {
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    reorderColumns(originalColumn, originalColumnOrder);
                                },
                            });

                            handle(error);
                        },
                    }
                );
            },
        },
        transformContainerId: (columnOrCard) => {
            return `board-column-${(columnOrCard as IBoardColumnCardProps["card"]).column_uid ?? columnOrCard.uid}`;
        },
    });

    return (
        <>
            {selectCardViewType && (
                <Flex justify="center" items="center" position="fixed" top="-2" left="0" h="20" w="full" z="50" gap="3" px="1">
                    <Box position="absolute" top="0" left="0" size="full" className="bg-secondary/70 bg-cover blur-md backdrop-blur-sm" />
                    <Flex wrap position="relative" z="50" textSize={{ initial: "base", sm: "lg" }} weight="semibold" className="text-primary">
                        <Box mr="2">{t(`board.Select ${selectCardViewType === "parents" ? "parent" : "child"} cards`)}</Box>
                        {selectedRelationshipUIDs.length > 0 && (
                            <Box>({t("board.{count} selected", { count: selectedRelationshipUIDs.length })})</Box>
                        )}
                    </Flex>
                    <Flex wrap position="relative" justify="end" z="50" className="text-right">
                        <Button
                            type="button"
                            variant="secondary"
                            className="mb-1 mr-2 h-6 px-2 py-0 sm:mb-0 sm:h-8 sm:px-4"
                            onClick={cancelCardSelection}
                        >
                            {t("common.Cancel")}
                        </Button>
                        <Button type="button" className="mr-2 h-6 px-2 py-0 sm:h-8 sm:px-4" onClick={saveCardSelection}>
                            {t("common.Save")}
                        </Button>
                    </Flex>
                </Flex>
            )}

            <Flex justify="between" px="4" pt="4" wrap>
                <BoardMemberList isSelectCardView={!!selectCardViewType} />
                <Flex items="center" gap="1">
                    <BoardFilter />
                </Flex>
            </Flex>

            <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragMove={onDragOverOrMove}>
                <ScrollArea.Root viewportId={viewportId} className="h-full max-h-[calc(100vh_-_theme(spacing.28)_-_theme(spacing.2))]">
                    <Flex direction="row" items="start" gap={{ initial: "8", sm: "10" }} p="4" onPointerDown={onPointerDown}>
                        <SortableContext items={columnUIDs} strategy={horizontalListSortingStrategy}>
                            {columns.map((col) => (
                                <BoardColumn key={col.uid} column={col} callbacksRef={callbacksRef} />
                            ))}
                        </SortableContext>
                        {hasRoleAction(Project.ERoleAction.Update) && !selectCardViewType && <BoardColumnAdd />}
                    </Flex>
                    <ScrollArea.Bar orientation="horizontal" />
                </ScrollArea.Root>

                {!TypeUtils.isUndefined(window) &&
                    createPortal(
                        <DragOverlay>
                            {activeColumn && <BoardColumn column={activeColumn} callbacksRef={callbacksRef} isOverlay />}
                            {activeCard && <BoardColumnCard card={activeCard} isOverlay />}
                        </DragOverlay>,
                        document.body
                    )}
            </DndContext>
        </>
    );
});
BoardResult.displayName = "Board.Result";

export default Board;
