import { Button, Flex, IconComponent, ScrollArea, Toast } from "@/components/base";
import UserAvatarList from "@/components/UserAvatarList";
import useChangeColumnOrder from "@/controllers/board/useChangeColumnOrder";
import useGetCards, { IBoardCard } from "@/controllers/board/useGetCards";
import { IBoardProject } from "@/controllers/board/useProjectAvailable";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useColumnRowSortable from "@/core/hooks/useColumnRowSortable";
import { ProjectColumn } from "@/core/models";
import { IAuthUser, useAuth } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { ROUTES } from "@/core/routing/constants";
import BoardColumnCard, { IBoardColumnCardProps } from "@/pages/BoardPage/components/board/BoardColumnCard";
import BoardColumn, { IBoardColumnProps } from "@/pages/BoardPage/components/board/BoardColumn";
import BoardFilter from "@/pages/BoardPage/components/board/BoardFilter";
import { transformStringFilters } from "@/pages/BoardPage/components/board/boardFilterUtils";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

export interface IBoardProps {
    socket: IConnectedSocket;
    project: IBoardProject;
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
                <BoardResult socket={socket} project={project} columns={projectData.columns} cards={projectData.cards} currentUser={aboutMe()!} />
            )}
        </>
    );
}

interface IBoardResultProps {
    socket: IConnectedSocket;
    project: IBoardProject;
    columns: ProjectColumn.Interface[];
    cards: IBoardCard[];
    currentUser: IAuthUser;
}

function BoardResult({ socket, project, columns: flatColumns, cards: flatCards, currentUser }: IBoardResultProps) {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const rawFilters = searchParams.get("filters");
    const filters = transformStringFilters(rawFilters);
    const [t] = useTranslation();
    const [columns, setColumns] = useState<ProjectColumn.Interface[]>(flatColumns);
    const columnUIDs = useMemo(() => columns.map((col) => col.uid), [columns]);
    const [cards] = useState<IBoardCard[]>(flatCards);
    const cardsMap = useMemo<Record<string, IBoardCard>>(() => {
        const map: Record<string, IBoardCard> = {};
        cards.forEach((card) => {
            map[card.uid] = card;
        });
        return map;
    }, [cards]);
    const dndContextId = useId();
    const { mutate: changeColumnOrderMutate } = useChangeColumnOrder();
    const {
        activeColumn,
        activeRow: activeCard,
        containerIdRowDragCallbacksRef: callbacksRef,
        sensors,
        onDragStart,
        onDragEnd,
        onDragOver,
    } = useColumnRowSortable<IBoardColumnProps["column"], IBoardColumnCardProps["card"]>({
        columnDragDataType: "Column",
        rowDragDataType: "Card",
        columnCallbacks: {
            onDragEnd: (originalColumn, index) => {
                setColumns((prev) => arrayMove(prev, originalColumn.order, index).map((col, i) => ({ ...col, order: i })));

                changeColumnOrderMutate(
                    { project_uid: project.uid, column_uid: originalColumn.uid, order: index },
                    {
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
        transformContainerId: (card) => `board-column-${card.column_uid}`,
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
                <Flex items="center" gap="1">
                    <UserAvatarList users={project.members} maxVisible={6} size="default" spacing="3" listAlign="start" />
                    <Button variant="outline" size="icon" className="size-10" title={t("card.Add members")}>
                        <IconComponent icon="plus" size="6" />
                    </Button>
                </Flex>
                <Flex items="center" gap="1">
                    <BoardFilter members={project.members} cards={flatCards} filters={filters} />
                </Flex>
            </Flex>

            <DndContext id={dndContextId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
                <ScrollArea.Root className="h-full max-h-[calc(100vh_-_theme(spacing.28)_-_theme(spacing.2))]">
                    <Flex direction="row" items="start" gap="10" p="4" onMouseDown={scrollHorizontal}>
                        <SortableContext items={columnUIDs} strategy={horizontalListSortingStrategy}>
                            {columns.map((col) => (
                                <BoardColumn
                                    key={col.uid}
                                    socket={socket}
                                    project={project}
                                    filters={filters}
                                    column={col}
                                    callbacksRef={callbacksRef}
                                    cardsMap={cardsMap}
                                    currentUser={currentUser}
                                />
                            ))}
                        </SortableContext>
                    </Flex>
                    <ScrollArea.Bar orientation="horizontal" />
                </ScrollArea.Root>

                {typeof window !== "undefined" &&
                    createPortal(
                        <DragOverlay>
                            {activeColumn && (
                                <BoardColumn
                                    socket={socket}
                                    project={project}
                                    filters={filters}
                                    column={activeColumn}
                                    callbacksRef={callbacksRef}
                                    cardsMap={cardsMap}
                                    currentUser={currentUser}
                                    isOverlay
                                />
                            )}
                            {activeCard && (
                                <BoardColumnCard project={project} card={activeCard} currentUser={currentUser} filters={filters} isOverlay />
                            )}
                        </DragOverlay>,
                        document.body
                    )}
            </DndContext>
        </>
    );
}

export default Board;
