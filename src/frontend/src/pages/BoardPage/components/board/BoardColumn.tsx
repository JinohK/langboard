import { Card, Flex, ScrollArea, Skeleton } from "@/components/base";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useChangeCardOrder, { IChangeCardOrderForm } from "@/controllers/api/board/useChangeCardOrder";
import useBoardCardCreatedHandlers from "@/controllers/socket/board/useBoardCardCreatedHandlers";
import { IRowDragCallback } from "@/core/hooks/useColumnRowSortable";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project, ProjectCard, ProjectColumn } from "@/core/models";
import { BoardAddCarddProvider } from "@/core/providers/BoardAddCardProvider";
import { useBoard } from "@/core/providers/BoardProvider";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardColumnAddCard from "@/pages/BoardPage/components/board/BoardColumnAddCard";
import BoardColumnAddCardButton from "@/pages/BoardPage/components/board/BoardColumnAddCardButton";
import BoardColumnCard, { IBoardColumnCardProps, SkeletonBoardColumnCard } from "@/pages/BoardPage/components/board/BoardColumnCard";
import BoardColumnHeader from "@/pages/BoardPage/components/board/BoardColumnHeader";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { tv } from "tailwind-variants";

export function SkeletonBoardColumn({ cardCount }: { cardCount: number }) {
    return (
        <Card.Root className="my-1 w-80 flex-shrink-0 border-transparent">
            <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold">
                <Skeleton className="h-6 w-1/3" />
            </Card.Header>
            <Card.Content className="flex max-h-[calc(100vh_-_theme(spacing.52))] flex-grow flex-col gap-2 overflow-hidden p-3">
                <div className="overflow-hidden pb-2.5">
                    <Flex direction="col" gap="3">
                        {Array.from({ length: cardCount }).map(() => (
                            <SkeletonBoardColumnCard key={createShortUUID()} />
                        ))}
                    </Flex>
                </div>
            </Card.Content>
        </Card.Root>
    );
}

export interface IBoardColumnProps {
    column: ProjectColumn.Interface;
    callbacksRef: React.MutableRefObject<Record<string, IRowDragCallback<IBoardColumnCardProps["card"]>>>;
    isOverlay?: bool;
}

interface IBoardColumnDragData {
    type: "Column";
    data: IBoardColumnProps["column"];
}

const BoardColumn = memo(({ column, callbacksRef, isOverlay }: IBoardColumnProps) => {
    const { setIsLoadingRef } = usePageLoader();
    const { project, filters, socket, cards: allCards, cardsMap, hasRoleAction, filterCard, filterCardMember, filterCardRelationships } = useBoard();
    const updater = useReducer((x) => x + 1, 0);
    const [updated, forceUpdate] = updater;
    const PAGE_SIZE = 20;
    const cardUIDs = useMemo(() => {
        return Object.keys(cardsMap)
            .filter((cardUID) => cardsMap[cardUID].column_uid === column.uid)
            .filter((cardUID) => filterCard(cardsMap[cardUID]))
            .filter((cardUID) => filterCardMember(cardsMap[cardUID]))
            .filter((cardUID) => filterCardRelationships(cardsMap[cardUID]))
            .sort((a, b) => cardsMap[a].order - cardsMap[b].order);
    }, [filters, updated]);
    const { items, nextPage, hasMore, toLastPage } = useInfiniteScrollPager({ allItems: cardUIDs, size: PAGE_SIZE, updater });
    const cards = items.map((cardUID) => cardsMap[cardUID]);
    const closeHoverCardRef = useRef<(() => void) | undefined>();
    const { mutate: changeCardOrderMutate } = useChangeCardOrder();
    const columnId = `board-column-${column.uid}`;
    const createdCard = (card: ProjectCard.IBoard) => {
        if (cardsMap[card.uid]) {
            return;
        }

        allCards.push(card);
        cardsMap[card.uid] = card;
        forceUpdate();
    };
    const { moveToColumn, removeFromColumn, reorderInColumn } = useReorderRow({
        type: "BoardCard",
        eventNameParams: { uid: column.uid },
        topicId: project.uid,
        allRowsMap: cardsMap,
        rows: cards,
        columnKey: "column_uid",
        currentColumnId: column.uid,
        socket,
        updater,
    });
    const { on: onBoardCardCreated } = useBoardCardCreatedHandlers({
        socket,
        projectUID: project.uid,
        columnUID: column.uid,
        callback: (data) => {
            createdCard(data.card);
        },
    });
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
    const onPointerStart = useCallback(
        (type: "mouse" | "touch") => (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
            if ((e.target as HTMLElement)?.closest?.(`[${DISABLE_DRAGGING_ATTR}]`)) {
                return;
            }

            const targetListener = type === "mouse" ? "onMouseDown" : "onTouchStart";

            listeners?.[targetListener]?.(e);
        },
        []
    );
    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        if ((e.target as HTMLElement)?.closest?.(`[${DISABLE_DRAGGING_ATTR}]`)) {
            return;
        }

        listeners?.onKeyDown?.(e);
    }, []);

    callbacksRef.current[columnId] = {
        onDragEnd: (originalCard, index) => {
            const isOrderUpdated = originalCard.column_uid !== column.uid || originalCard.order !== index;
            reorderInColumn(originalCard.uid, index);
            if (!isOrderUpdated) {
                forceUpdate();
                return;
            }

            const form: IChangeCardOrderForm = { project_uid: project.uid, card_uid: originalCard.uid, order: index };
            if (originalCard.column_uid !== column.uid) {
                form.parent_uid = column.uid;
            }

            cardsMap[originalCard.uid].order = index;
            cardsMap[originalCard.uid].column_uid = column.uid;
            forceUpdate();

            setTimeout(() => {
                changeCardOrderMutate(form);
            }, 300);
        },
        onDragOverOrMove: (activeCard, index, isForeign) => {
            if (!isForeign) {
                return;
            }

            const shouldRemove = index === -1;
            if (shouldRemove) {
                removeFromColumn(activeCard.uid);
            } else {
                moveToColumn(activeCard.uid, index, column.uid);
            }

            forceUpdate();
        },
    };

    useEffect(() => {
        const { off } = onBoardCardCreated();
        setIsLoadingRef.current(false);

        return () => {
            off();
        };
    }, []);

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "my-1 w-80 flex-shrink-0 snap-center ring-primary",
        variants: {
            dragging: {
                over: "ring-2 opacity-30",
                overlay: "ring-2",
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
            onMouseDown: onPointerStart("mouse"),
            onTouchStart: onPointerStart("touch"),
            onKeyDown,
        };
    } else {
        rootProps = {
            className: variants(),
        };
        headerProps = {};
    }

    return (
        <BoardAddCarddProvider columnUID={column.uid} viewportId={columnId} toLastPage={toLastPage} createdCard={createdCard}>
            <Card.Root {...rootProps}>
                <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold" {...headerProps}>
                    <BoardColumnHeader isDragging={isDragging} column={column} />
                </Card.Header>
                <ScrollArea.Root viewportId={columnId} mutable={updated} onScroll={() => closeHoverCardRef.current?.()}>
                    <Card.Content
                        className={cn(
                            "flex flex-grow flex-col gap-2 p-3",
                            hasRoleAction(Project.ERoleAction.CARD_WRITE) && column.uid !== Project.ARCHIVE_COLUMN_UID
                                ? "max-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.1))]"
                                : "max-h-[calc(100vh_-_theme(spacing.52)_-_theme(spacing.1))]"
                        )}
                    >
                        <InfiniteScroll
                            getScrollParent={() => document.getElementById(columnId)}
                            loadMore={nextPage}
                            loader={<SkeletonBoardColumnCard key={createShortUUID()} />}
                            hasMore={hasMore}
                            threshold={140}
                            initialLoad={false}
                            className="pb-2.5"
                            useWindow={false}
                            pageStart={1}
                        >
                            <SortableContext id={columnId} items={cardUIDs}>
                                <Flex direction="col" gap="3">
                                    {cards.map((card) => (
                                        <BoardColumnCard key={`${column.uid}-${card.uid}`} card={card} closeHoverCardRef={closeHoverCardRef} />
                                    ))}
                                </Flex>
                            </SortableContext>
                            <BoardColumnAddCard />
                        </InfiniteScroll>
                    </Card.Content>
                </ScrollArea.Root>
                <Card.Footer className="px-3 py-2">
                    <BoardColumnAddCardButton />
                </Card.Footer>
            </Card.Root>
        </BoardAddCarddProvider>
    );
});

export default BoardColumn;
