import { Box, Card, Flex, ScrollArea, Skeleton } from "@/components/base";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import useChangeCardOrder, { IChangeCardOrderForm } from "@/controllers/api/board/useChangeCardOrder";
import { IRowDragCallback, ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project, ProjectCard, ProjectColumn } from "@/core/models";
import { BoardAddCardProvider } from "@/core/providers/BoardAddCardProvider";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardColumnAddCard from "@/pages/BoardPage/components/board/BoardColumnAddCard";
import BoardColumnAddCardButton from "@/pages/BoardPage/components/board/BoardColumnAddCardButton";
import BoardColumnCard, { IBoardColumnCardProps, SkeletonBoardColumnCard } from "@/pages/BoardPage/components/board/BoardColumnCard";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { tv } from "tailwind-variants";
import InfiniteScroller from "@/components/InfiniteScroller";
import BoardColumnHeader from "@/pages/BoardPage/components/board/BoardColumnHeader";
import useBoardUIColumnDeletedHandlers from "@/controllers/socket/board/column/useBoardUIColumnDeletedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import useBoardCardCreatedHandlers from "@/controllers/socket/board/useBoardCardCreatedHandlers";

export function SkeletonBoardColumn({ cardCount }: { cardCount: number }) {
    return (
        <Card.Root className="my-1 w-80 flex-shrink-0 border-transparent">
            <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold">
                <Skeleton h="6" className="w-1/3" />
            </Card.Header>
            <Card.Content className="flex max-h-[calc(100vh_-_theme(spacing.52))] flex-grow flex-col gap-2 overflow-hidden p-3">
                <Box pb="2.5" className="overflow-hidden">
                    <Flex direction="col" gap="3">
                        {Array.from({ length: cardCount }).map(() => (
                            <SkeletonBoardColumnCard key={createShortUUID()} />
                        ))}
                    </Flex>
                </Box>
            </Card.Content>
        </Card.Root>
    );
}

export interface IBoardColumnProps {
    column: ProjectColumn.TModel;
    callbacksRef: React.RefObject<Record<string, IRowDragCallback<IBoardColumnCardProps["card"]>>>;
    isOverlay?: bool;
}

interface IBoardColumnDragData extends ISortableDragData<ProjectColumn.TModel> {
    type: "Column";
}

const PAGE_SIZE = 20;

const BoardColumn = memo(({ column, callbacksRef, isOverlay }: IBoardColumnProps) => {
    const { selectCardViewType } = useBoardRelationshipController();
    const { setIsLoadingRef } = usePageHeader();
    const { project, filters, socket, cardsMap, hasRoleAction, filterCard, filterCardMember, filterCardLabels, filterCardRelationships } = useBoard();
    const updater = useReducer((x) => x + 1, 0);
    const [updated, forceUpdate] = updater;
    const columnCards = ProjectCard.Model.useModels(
        (model) => {
            return (
                model.column_uid === column.uid &&
                filterCard(model) &&
                filterCardMember(model) &&
                filterCardLabels(model) &&
                filterCardRelationships(model)
            );
        },
        [column, updated, filters]
    );
    const sortedCards = columnCards.sort((a, b) => a.order - b.order);
    const cardUIDs = useMemo(() => sortedCards.map((card) => card.uid), [sortedCards]);
    const { items: cards, nextPage, hasMore, toLastPage } = useInfiniteScrollPager({ allItems: sortedCards, size: PAGE_SIZE, updater });
    const closeHoverCardRef = useRef<() => void>(null);
    const { mutate: changeCardOrderMutate } = useChangeCardOrder();
    const columnId = `board-column-${column.uid}`;
    const { moveToColumn, removeFromColumn, reorderInColumn } = useReorderRow({
        type: "ProjectCard",
        eventNameParams: { uid: column.uid },
        topicId: project.uid,
        allRowsMap: cardsMap,
        rows: cards,
        columnKey: "column_uid",
        currentColumnId: column.uid,
        socket,
        updater,
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
    const cardCreatedHandlers = useBoardCardCreatedHandlers({
        projectUID: project.uid,
        columnUID: column.uid,
        callback: () => {
            forceUpdate();
        },
    });
    const columnDeletedHandlers = useBoardUIColumnDeletedHandlers({
        project,
        callback: () => {
            if (!column.is_archive) {
                return;
            }

            forceUpdate();
        },
    });
    useSwitchSocketHandlers({ socket, handlers: [cardCreatedHandlers, columnDeletedHandlers] });

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
        },
    };

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, [cardUIDs]);

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "my-1 w-72 sm:w-80 flex-shrink-0 snap-center ring-primary",
        variants: {
            dragging: {
                over: "ring-2 opacity-30",
                overlay: "ring-2",
            },
        },
    });

    let rootProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    let headerProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (hasRoleAction(Project.ERoleAction.Update) || !selectCardViewType) {
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
        <BoardAddCardProvider column={column} viewportId={columnId} toLastPage={toLastPage}>
            <Card.Root {...rootProps}>
                <BoardColumnHeader isDragging={isDragging} column={column} headerProps={headerProps} />
                <ScrollArea.Root viewportId={columnId} mutable={updated} onScroll={() => closeHoverCardRef.current?.()}>
                    <Card.Content
                        className={cn(
                            "flex flex-grow flex-col gap-2 p-3",
                            hasRoleAction(Project.ERoleAction.CardWrite) && !column.is_archive
                                ? "max-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.2))]"
                                : "max-h-[calc(100vh_-_theme(spacing.56)_-_theme(spacing.1))]"
                        )}
                        onWheel={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <InfiniteScroller
                            scrollable={() => document.getElementById(columnId)}
                            loadMore={nextPage}
                            loader={<SkeletonBoardColumnCard key={createShortUUID()} />}
                            hasMore={hasMore}
                            threshold={63}
                            className="pb-2.5"
                        >
                            <SortableContext id={columnId} items={cardUIDs}>
                                <Flex direction="col" gap="3">
                                    {cards.map((card) => (
                                        <BoardColumnCard key={`${column.uid}-${card.uid}`} card={card} closeHoverCardRef={closeHoverCardRef} />
                                    ))}
                                </Flex>
                            </SortableContext>
                            <BoardColumnAddCard />
                        </InfiniteScroller>
                    </Card.Content>
                </ScrollArea.Root>
                <Card.Footer className="px-3 py-2">
                    <BoardColumnAddCardButton />
                </Card.Footer>
            </Card.Root>
        </BoardAddCardProvider>
    );
});

export default BoardColumn;
