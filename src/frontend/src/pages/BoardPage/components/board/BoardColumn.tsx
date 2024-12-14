import { Card, Flex, Input, ScrollArea, Skeleton, Toast } from "@/components/base";
import useChangeCardOrder, { IChangeCardOrderForm } from "@/controllers/api/board/useChangeCardOrder";
import useChangeProjectColumnName from "@/controllers/api/board/useChangeProjectColumnName";
import useBoardCardCreatedHandlers from "@/controllers/socket/board/useBoardCardCreatedHandlers";
import useBoardColumnNameChangedHandlers from "@/controllers/socket/board/useBoardColumnNameChangedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { IRowDragCallback } from "@/core/hooks/useColumnRowSortable";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import useReorderRow from "@/core/hooks/useReorderRow";
import { Project, ProjectColumn } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardColumnCard, { IBoardColumnCardProps, SkeletonBoardColumnCard } from "@/pages/BoardPage/components/board/BoardColumnCard";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

const DISABLE_DRAGGING_ATTR = "data-drag-disabled";

const BoardColumn = ({ column, callbacksRef, isOverlay }: IBoardColumnProps) => {
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
    const { items, nextPage, hasMore } = useInfiniteScrollPager({ allItems: cardUIDs, size: PAGE_SIZE, updater });
    const cards = items.map((cardUID) => cardsMap[cardUID]);
    const closeHoverCardRef = useRef<(() => void) | undefined>();
    const { mutate: changeCardOrderMutate } = useChangeCardOrder();
    const columnId = `board-column-${column.uid}`;
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
        <Card.Root {...rootProps}>
            <Card.Header className="flex flex-row items-start space-y-0 pb-1 pt-4 text-left font-semibold" {...headerProps}>
                <BoardColumnHeader column={column} />
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
                        <SortableContext id={columnId} items={cardUIDs}>
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
};

const BoardColumnHeader = memo(({ column }: { column: ProjectColumn.Interface }) => {
    const { project, socket, hasRoleAction } = useBoard();
    const [t] = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [columnName, setColumnName] = useState(column.name);
    const { mutateAsync: changeProjectColumnNameMutateAsync } = useChangeProjectColumnName();
    const { on: onBoardColumnNameChanged } = useBoardColumnNameChangedHandlers({
        socket,
        projectUID: project.uid,
        callback: (data) => {
            if (data.uid !== column.uid || data.name === column.name) {
                return;
            }

            column.name = data.name;
            setColumnName(data.name);
        },
    });
    const canEdit = hasRoleAction(Project.ERoleAction.UPDATE);

    useEffect(() => {
        const { off } = onBoardColumnNameChanged();

        return () => {
            off();
        };
    }, []);

    const changeMode = (mode: "edit" | "view") => {
        if (!canEdit) {
            return;
        }

        if (mode === "edit") {
            setIsEditing(true);
            return;
        }

        const newValue = inputRef.current?.value?.replace(/\n/g, " ").trim() ?? "";
        if (!newValue.length || column.name.trim() === newValue) {
            setIsEditing(false);
            return;
        }

        const promise = changeProjectColumnNameMutateAsync({
            project_uid: project.uid,
            column_uid: column.uid,
            name: newValue,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Changing..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: (data) => {
                column.name = data.name;
                setColumnName(data.name);
                return t("card.Description changed successfully.");
            },
            finally: () => {
                setIsEditing(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <>
            {!isEditing ? (
                <span {...{ [DISABLE_DRAGGING_ATTR]: "" }} className="truncate">
                    {columnName}
                </span>
            ) : (
                <Input
                    ref={inputRef}
                    className="rounded-none border-x-0 border-t-0 p-0 font-semibold focus-visible:border-b-primary focus-visible:ring-0"
                    defaultValue={columnName}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onBlur={() => changeMode("view")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            changeMode("view");
                            return;
                        }
                    }}
                />
            )}
        </>
    );
});

export default BoardColumn;
