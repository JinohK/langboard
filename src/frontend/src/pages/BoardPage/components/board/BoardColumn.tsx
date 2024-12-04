import { Card, Flex, ScrollArea } from "@/components/base";
import useChangeCardOrder, { IChangeCardOrderForm } from "@/controllers/api/board/useChangeCardOrder";
import useBoardCardCreatedHandlers from "@/controllers/socket/board/useBoardCardCreatedHandlers";
import { IRowDragCallback } from "@/core/hooks/useColumnRowSortable";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project, ProjectColumn } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardColumnCard, { IBoardColumnCardProps, SkeletonBoardColumnCard } from "@/pages/BoardPage/components/board/BoardColumnCard";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useReducer, useRef } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { tv } from "tailwind-variants";

export interface IBoardColumnProps {
    column: ProjectColumn.Interface;
    callbacksRef: React.MutableRefObject<Record<string, IRowDragCallback<IBoardColumnCardProps["card"]>>>;
    isOverlay?: bool;
}

interface IBoardColumnDragData {
    type: "Column";
    data: IBoardColumnProps["column"];
}

function BoardColumn({ column, callbacksRef, isOverlay }: IBoardColumnProps) {
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
    const { items, nextPage, hasMore } = useInfiniteScrollPager({ allItems: cardUIDs, size: PAGE_SIZE, updater });
    const cards = items.map((cardUID) => cardsMap[cardUID]);
    const closeHoverCardRef = useRef<(() => void) | undefined>();
    const { mutate: changeCardOrderMutate } = useChangeCardOrder();
    const columnId = `board-column-${column.uid}`;
    const {
        moveToColumn,
        removeFromColumn,
        reorderInColumn,
        sendRowOrderChanged: sendBoardCardOrderChanged,
    } = useReorderRow({
        type: "BoardCard",
        eventNameParams: { uid: column.uid },
        allRowsMap: cardsMap,
        rows: cards,
        columnKey: "column_uid",
        currentColumnId: column.uid,
        socket,
        updater,
    });
    const { on: onBoardCardCreated } = useBoardCardCreatedHandlers({
        socket,
        columnUID: column.uid,
        callback: (data) => {
            allCards.push(data.card);
            cardsMap[data.card.uid] = data.card;
            forceUpdate();
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
                changeCardOrderMutate(form, {
                    onSuccess: () => {
                        sendBoardCardOrderChanged({
                            column_name: column.name,
                            from_column_uid: originalCard.column_uid,
                            to_column_uid: form.parent_uid,
                            uid: originalCard.uid,
                            order: index,
                        });
                    },
                });
            }, 300);
        },
        onDragOver: (activeCard, index, isForeign) => {
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
                default: "border-2 border-transparent",
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
                        hasMore={hasMore}
                        threshold={140}
                        initialLoad={false}
                        className="pb-2.5"
                        useWindow={false}
                        pageStart={1}
                    >
                        <SortableContext id={columnId} items={cardUIDs} strategy={verticalListSortingStrategy}>
                            <Flex direction="col" gap="3">
                                {cards.map((card) => (
                                    <BoardColumnCard key={`${column.uid}-${card.uid}`} card={card} closeHoverCardRef={closeHoverCardRef} />
                                ))}
                            </Flex>
                        </SortableContext>
                    </InfiniteScroll>
                </Card.Content>
            </ScrollArea.Root>
        </Card.Root>
    );
}

export default BoardColumn;
