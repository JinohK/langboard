import { Card, Flex, ScrollArea } from "@/components/base";
import useChangeCardOrder, { IChangeCardOrderForm } from "@/controllers/board/useChangeCardOrder";
import { IBoardCard } from "@/controllers/board/useGetCards";
import { IBoardProject } from "@/controllers/board/useProjectAvailable";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IRowDragCallback } from "@/core/hooks/useColumnRowSortable";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project, ProjectColumn } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import { createShortUUID, format } from "@/core/utils/StringUtils";
import BoardColumnCard, { IBoardColumnCardProps, SkeletonBoardColumnCard } from "@/pages/BoardPage/components/board/BoardColumnCard";
import { filterCard, filterCardMember, IFilterMap, filterCardRelationships } from "@/pages/BoardPage/components/board/boardFilterUtils";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { tv } from "tailwind-variants";

export interface IBoardColumnProps {
    socket: IConnectedSocket;
    project: IBoardProject;
    filters: IFilterMap;
    column: ProjectColumn.Interface;
    callbacksRef: React.MutableRefObject<Record<string, IRowDragCallback<IBoardColumnCardProps["card"]>>>;
    cardsMap: Record<string, IBoardCard>;
    currentUser: IAuthUser;
    isOverlay?: bool;
}

interface IBoardColumnDragData {
    type: "Column";
    data: IBoardColumnProps["column"];
}

function BoardColumn({ socket, project, filters, column, callbacksRef, cardsMap, currentUser, isOverlay }: IBoardColumnProps) {
    const activeRef = useRef<IBoardCard | null>(null);
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;
    const cardUIDs = useMemo(() => {
        return Object.keys(cardsMap)
            .filter((cardUID) => cardsMap[cardUID].column_uid === column.uid)
            .filter((cardUID) => filterCard(filters, cardsMap[cardUID]))
            .filter((cardUID) => filterCardMember(filters, project.members, cardsMap[cardUID], currentUser))
            .filter((cardUID) => filterCardRelationships(filters, cardsMap[cardUID]))
            .sort((a, b) => cardsMap[a].order - cardsMap[b].order);
    }, [filters, updated]);
    const cards = useMemo<IBoardCard[]>(() => {
        return cardUIDs.slice(0, page * PAGE_SIZE).map((cardUID) => cardsMap[cardUID]);
    }, [cardUIDs, page, updated]);
    const closeHoverCardRef = useRef<(() => void) | undefined>();
    const lastPageRef = useRef(Math.ceil(cardUIDs.length / PAGE_SIZE));
    const { mutate: changeCardOrderMutate } = useChangeCardOrder();
    const columnId = `board-column-${column.uid}`;
    callbacksRef.current[columnId] = {
        onDragEnd: (originalActiveCard, index) => {
            activeRef.current = null;
            const form: IChangeCardOrderForm = { project_uid: project.uid, card_uid: originalActiveCard.uid, order: index };
            const uidsShouldUpdate = [originalActiveCard.column_uid];
            if (originalActiveCard.column_uid !== column.uid) {
                form.column_uid = column.uid;
                uidsShouldUpdate.push(column.uid);
            }

            if (originalActiveCard.order > index) {
                cards.slice(index, originalActiveCard.order).forEach((t) => {
                    cardsMap[t.uid].order += 1;
                });
            }

            cardsMap[originalActiveCard.uid].order = index;
            cardsMap[originalActiveCard.uid].column_uid = column.uid;
            forceUpdate();

            setTimeout(() => {
                changeCardOrderMutate(form, {
                    onSuccess: () => {
                        socket.send(SOCKET_CLIENT_EVENTS.BOARD.CARD_ORDER_CHANGED, {
                            column_uids: uidsShouldUpdate,
                        });
                    },
                });
            }, 300);
        },
        onDragOver: (card, index, isForeign) => {
            if (!isForeign) {
                activeRef.current = card;
                if (card.order > index) {
                    cards.slice(index, card.order).forEach((t) => {
                        cardsMap[t.uid].order += 1;
                    });
                } else {
                    cards.slice(card.order + 1, index + 1).forEach((t) => {
                        cardsMap[t.uid].order -= 1;
                    });
                }
                cardsMap[card.uid].order = index;
                forceUpdate();
                return;
            }

            activeRef.current = card;

            const shouldRemove = index === -1;
            if (shouldRemove) {
                cards.slice(card.order + 1).forEach((t) => {
                    cardsMap[t.uid].order -= 1;
                });
                forceUpdate();
                return;
            }

            cards.slice(index).forEach((t) => {
                cardsMap[t.uid].order += 1;
            });
            cardsMap[card.uid].order = index;
            cardsMap[card.uid].column_uid = column.uid;
            forceUpdate();
        },
    };
    const { hasRoleAction } = useRoleActionFilter<Project.TRoleActions>(project.current_user_role_actions);
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.uid,
        data: {
            type: "Column",
            data: column,
        } satisfies IBoardColumnDragData,
        attributes: {
            roleDescription: `Column: ${column.name}`,
        },
    });

    useEffect(() => {
        const shouldRefetchCallback = () => {
            forceUpdate();
        };

        const eventName = format(SOCKET_SERVER_EVENTS.BOARD.CARD_ORDER_CHANGED, { column_uid: column.uid });

        socket.on(eventName, shouldRefetchCallback);

        return () => {
            socket.off(eventName, shouldRefetchCallback);
        };
    }, []);

    useEffect(() => {
        forceUpdate();
    }, [page]);

    const nextPage = (next: number) => {
        if (next - page > 1) {
            return;
        }

        new Promise((resolve) => {
            setPage(next);
            resolve(undefined);
        });
    };

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "my-1 w-80 flex-shrink-0 snap-center",
        variants: {
            dragging: {
                default: "border-2 border-transparent",
                over: "ring-2 opacity-30",
                overlay: "ring-2 ring-primary",
            },
        },
    });

    let rootProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    let headerProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (hasRoleAction(Project.ERoleAction.UPDATE)) {
        rootProps = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            ref: setNodeRef,
        };
        headerProps = {
            ...attributes,
            ...listeners,
        };
    } else {
        rootProps = {
            className: variants(),
        };
        headerProps = {};
    }

    return (
        <Card.Root {...rootProps}>
            <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold" {...headerProps}>
                <span>{column.name}</span>
            </Card.Header>
            <ScrollArea.Root viewportId={columnId} mutable={updated} onScroll={() => closeHoverCardRef.current?.()}>
                <Card.Content className="flex max-h-[calc(100vh_-_theme(spacing.52))] flex-grow flex-col gap-2 p-3">
                    <InfiniteScroll
                        getScrollParent={() => document.getElementById(columnId)}
                        loadMore={nextPage}
                        loader={<SkeletonBoardColumnCard key={createShortUUID()} />}
                        hasMore={page < lastPageRef.current && cardUIDs.length > PAGE_SIZE}
                        threshold={140}
                        initialLoad={false}
                        className="pb-2.5"
                        useWindow={false}
                        pageStart={1}
                    >
                        <SortableContext id={columnId} items={cardUIDs} strategy={verticalListSortingStrategy}>
                            <Flex direction="col" gap="3">
                                {cards.map((card) => {
                                    return (
                                        <BoardColumnCard
                                            key={`${column.uid}-${card.uid}`}
                                            project={project}
                                            card={card}
                                            filters={filters}
                                            closeHoverCardRef={closeHoverCardRef}
                                        />
                                    );
                                })}
                            </Flex>
                        </SortableContext>
                    </InfiniteScroll>
                </Card.Content>
            </ScrollArea.Root>
        </Card.Root>
    );
}

export default BoardColumn;
