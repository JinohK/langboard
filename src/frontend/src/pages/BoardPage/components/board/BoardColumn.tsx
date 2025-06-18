"use client";

import { memo, useEffect, useMemo, useReducer, useRef, useState } from "react";
import invariant from "tiny-invariant";
import BoardColumnCard, { SkeletonBoardColumnCard } from "@/pages/BoardPage/components/board/BoardColumnCard";
import { useBoard } from "@/core/providers/BoardProvider";
import { Project, ProjectCard, ProjectColumn } from "@/core/models";
import { BoardAddCardProvider } from "@/core/providers/BoardAddCardProvider";
import { Box, Card, Flex, ScrollArea, Skeleton } from "@/components/base";
import BoardColumnHeader from "@/pages/BoardPage/components/board/BoardColumnHeader";
import { cn } from "@/core/utils/ComponentUtils";
import BoardColumnAddCard from "@/pages/BoardPage/components/board/BoardColumnAddCard";
import BoardColumnAddCardButton from "@/pages/BoardPage/components/board/BoardColumnAddCardButton";
import TypeUtils from "@/core/utils/TypeUtils";
import useBoardCardCreatedHandlers from "@/controllers/socket/board/useBoardCardCreatedHandlers";
import useBoardUIColumnDeletedHandlers from "@/controllers/socket/board/column/useBoardUIColumnDeletedHandlers";
import { createShortUUID } from "@/core/utils/StringUtils";
import { columnRowDndHelpers } from "@/core/helpers/dnd";
import { TColumnState } from "@/core/helpers/dnd/types";
import { BLOCK_BOARD_PANNING_ATTR, BOARD_DND_SETTINGS, BOARD_DND_SYMBOL_SET } from "@/pages/BoardPage/components/board/BoardConstants";
import { COLUMN_IDLE } from "@/core/helpers/dnd/createDndColumnEvents";
import useRowReordered from "@/core/hooks/useRowReordered";

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

const stateStyles: { [Key in TColumnState["type"]]: string } = {
    idle: "cursor-grab",
    "is-row-over": "ring-2 ring-primary",
    "is-dragging": "opacity-40 ring-2 ring-primary",
    "is-column-over": "bg-secondary",
};

function BoardColumn({ column }: { column: ProjectColumn.TModel }) {
    const { hasRoleAction } = useBoard();
    const scrollableRef = useRef<HTMLDivElement | null>(null);
    const outerFullHeightRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<TColumnState>(COLUMN_IDLE);
    const order = column.useField("order");
    const columnId = `board-column-${column.uid}`;

    useEffect(() => {
        const outer = outerFullHeightRef.current;
        const scrollable = scrollableRef.current;
        const header = headerRef.current;
        const inner = innerRef.current;
        invariant(outer);
        invariant(scrollable);
        invariant(header);
        invariant(inner);

        return columnRowDndHelpers.column<ProjectColumn.TModel>({
            column,
            symbolSet: BOARD_DND_SYMBOL_SET,
            draggable: header,
            dropTarget: outer,
            scrollable,
            settings: BOARD_DND_SETTINGS,
            setState,
            renderPreview({ container }) {
                // Simple drag preview generation: just cloning the current element.
                // Not using react for this.
                const rect = outer.getBoundingClientRect();
                const preview = outer.cloneNode(true);
                invariant(TypeUtils.isElement(preview, "div"));
                preview.classList.add("ring-2", "ring-primary");
                preview.style.width = `${rect.width}px`;
                preview.style.height = `${rect.height}px`;

                container.appendChild(preview);
            },
        });
    }, [column, order]);

    return (
        <BoardAddCardProvider column={column} viewportId={columnId} toLastPage={() => {}}>
            <Card.Root ref={outerFullHeightRef} className={cn("my-1 w-72 flex-shrink-0 snap-center ring-primary sm:w-80", stateStyles[state.type])}>
                <BoardColumnHeader isDragging={state.type !== "idle"} column={column} headerProps={{ ref: headerRef }} />
                <ScrollArea.Root
                    viewportId={columnId}
                    viewportRef={scrollableRef}
                    viewportClassName="!overflow-y-auto"
                    onScroll={() => {
                        ProjectCard.Model.getModels((model) => !!model.isHoverCardOpened).forEach((model) => {
                            model.isHoverCardOpened = false;
                        });
                    }}
                >
                    <Card.Content
                        className={cn(
                            "flex flex-grow flex-col gap-2 p-3",
                            hasRoleAction(Project.ERoleAction.CardWrite) && !column.is_archive
                                ? "max-h-[calc(100vh_-_theme(spacing.64)_-_theme(spacing.2))]"
                                : "max-h-[calc(100vh_-_theme(spacing.56)_-_theme(spacing.1))]"
                        )}
                        {...{ [BLOCK_BOARD_PANNING_ATTR]: true }}
                        ref={innerRef}
                    >
                        <BoardColumnCardList column={column} />
                        <BoardColumnAddCard />
                    </Card.Content>
                    <ScrollArea.Bar />
                </ScrollArea.Root>
                <Card.Footer className="px-3 py-2">
                    <BoardColumnAddCardButton />
                </Card.Footer>
            </Card.Root>
        </BoardAddCardProvider>
    );
}

/**
 * A memoized component for rendering out the card.
 *
 * Created so that state changes to the column don't require all cards to be rendered
 */
const BoardColumnCardList = memo(({ column }: { column: ProjectColumn.TModel }) => {
    const { project, socket, filters, filterCard, filterCardMember, filterCardLabels, filterCardRelationships } = useBoard();
    const updater = useReducer((x) => x + 1, 0);
    const [updated, forceUpdate] = updater;
    const cards = ProjectCard.Model.useModels(
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
    const cardCreatedHandlers = useMemo(
        () =>
            useBoardCardCreatedHandlers({
                projectUID: project.uid,
                columnUID: column.uid,
                callback: () => {
                    forceUpdate();
                },
            }),
        [forceUpdate]
    );
    const columnDeletedHandlers = useMemo(
        () =>
            useBoardUIColumnDeletedHandlers({
                project,
                callback: () => {
                    if (!column.is_archive) {
                        return;
                    }

                    forceUpdate();
                },
            }),
        [forceUpdate]
    );
    const { rows: columnCards } = useRowReordered({
        type: "ProjectCard",
        eventNameParams: { uid: column.uid },
        topicId: project.uid,
        rows: cards,
        socket,
        updater,
        otherHandlers: [cardCreatedHandlers, columnDeletedHandlers],
    });

    return columnCards.map((card) => <BoardColumnCard key={card.uid} card={card} />);
});

export default BoardColumn;
