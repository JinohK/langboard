import { Flex, ScrollArea, Toast } from "@/components/base";
import useChangeProjectColumnOrder from "@/controllers/api/board/useChangeProjectColumnOrder";
import useGetCards from "@/controllers/api/board/useGetCards";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import { useAuth } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import BoardColumnCard, { IBoardColumnCardProps } from "@/pages/BoardPage/components/board/BoardColumnCard";
import BoardColumn, { IBoardColumnProps } from "@/pages/BoardPage/components/board/BoardColumn";
import BoardFilter from "@/pages/BoardPage/components/board/BoardFilter";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BoardProvider, useBoard } from "@/core/providers/BoardProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import useReorderColumn from "@/core/hooks/useReorderColumn";
import BoardMemberList from "@/pages/BoardPage/components/board/BoardMemberList";
import { Project } from "@/core/models";

export interface IBoardProps {
    socket: IConnectedSocket;
    project: Project.IBoard;
}

function Board({ socket, project }: IBoardProps) {
    const { aboutMe } = useAuth();
    const { data: projectData, error } = useGetCards({ project_uid: project.uid });
    const [t] = useTranslation();
    const navigate = useNavigate();

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
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return (
        <>
            {!projectData || !aboutMe() ? (
                "loading..."
            ) : (
                <BoardProvider
                    socket={socket}
                    project={project}
                    columns={projectData.columns}
                    cards={projectData.cards}
                    currentUser={aboutMe()!}
                    currentUserRoleActions={project.current_user_role_actions}
                >
                    <BoardResult />
                </BoardProvider>
            )}
        </>
    );
}

function BoardResult() {
    const { project, columns: flatColumns, socket } = useBoard();
    const [t] = useTranslation();
    const {
        columns,
        setColumns,
        reorder: reorderColumns,
        sendColumnOrderChanged,
    } = useReorderColumn({
        type: "BoardColumn",
        eventNameParams: { uid: project.uid },
        columns: flatColumns,
        socket,
    });
    const columnUIDs = useMemo(() => columns.map((col) => col.uid), [columns]);
    const dndContextId = useId();
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
                if (!reorderColumns(originalColumn, index)) {
                    return;
                }

                changeProjectColumnOrderMutate(
                    { project_uid: project.uid, column_uid: originalColumn.uid, order: index },
                    {
                        onSuccess: (data) => {
                            sendColumnOrderChanged({ model_id: data.model_id });
                        },
                        onError: (error) => {
                            const { handle } = setupApiErrorHandler({
                                wildcardError: () => {
                                    Toast.Add.error(t("errors.Internal server error"));
                                    setColumns((prev) => arrayMove(prev, originalColumn.order, index).map((col, i) => ({ ...col, order: i })));
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

    const scrollHorizontal = (originalEvent: React.MouseEvent<HTMLElement>) => {
        if (originalEvent.target !== originalEvent.currentTarget) {
            return;
        }

        document.documentElement.style.cursor = "grabbing";
        document.documentElement.style.userSelect = "none";
        const target = originalEvent.currentTarget;
        const viewport = target.closest<HTMLDivElement>("[data-radix-scroll-area-viewport]")!;
        const originalMouseX = originalEvent.pageX;
        const originalScrollLeft = viewport.scrollLeft;

        const moveEvent = (event: MouseEvent) => {
            const x = event.pageX;
            const walkX = x - originalMouseX;
            viewport.scrollLeft = originalScrollLeft - walkX;
        };

        const upEvent = () => {
            document.documentElement.style.cursor = "";
            document.documentElement.style.userSelect = "";
            window.removeEventListener("mousemove", moveEvent);
            window.removeEventListener("mouseup", upEvent);
        };

        window.addEventListener("mousemove", moveEvent);
        window.addEventListener("mouseup", upEvent);
    };

    return (
        <>
            <Flex justify="between" px="4" pt="4" wrap="wrap">
                <BoardMemberList members={project.members} />
                <Flex items="center" gap="1">
                    <BoardFilter />
                </Flex>
            </Flex>

            <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragMove={onDragOverOrMove}>
                <ScrollArea.Root className="h-full max-h-[calc(100vh_-_theme(spacing.28)_-_theme(spacing.2))]">
                    <Flex direction="row" items="start" gap="10" p="4" onMouseDown={scrollHorizontal}>
                        <SortableContext items={columnUIDs} strategy={horizontalListSortingStrategy}>
                            {columns.map((col) => (
                                <BoardColumn key={col.uid} column={col} callbacksRef={callbacksRef} />
                            ))}
                        </SortableContext>
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
}

export default Board;
