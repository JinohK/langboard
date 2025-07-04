"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import invariant from "tiny-invariant";
import { BOARD_DND_SYMBOL_SET, HOVER_CARD_UID_ATTR } from "@/pages/BoardPage/components/board/BoardConstants";
import { ProjectCard, ProjectCardRelationship, ProjectChecklist } from "@/core/models";
import { Box, Card, Flex, Popover, Skeleton } from "@/components/base";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import useHoverEffect from "@/core/hooks/useHoverEffect";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import BoardColumnCardPreview from "@/pages/BoardPage/components/board/BoardColumnCardPreview";
import BoardColumnCardCollapsible from "@/pages/BoardPage/components/board/BoardColumnCardCollapsible";
import { cn } from "@/core/utils/ComponentUtils";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { TRowState } from "@/core/helpers/dnd/types";
import { ROW_IDLE } from "@/core/helpers/dnd/createDndRowEvents";
import { columnRowDndHelpers } from "@/core/helpers/dnd";

export function SkeletonBoardColumnCard({ ref }: { ref?: React.Ref<HTMLDivElement> }): JSX.Element {
    return (
        <Card.Root className="border-transparent shadow-transparent" ref={ref}>
            <Card.Header className="relative block py-4">
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">
                    <Skeleton display="inline-block" h="4" className="w-3/4" />
                </Card.Title>
                <Skeleton position="absolute" right="2.5" top="1" display="inline-block" size="8" />
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-end justify-between gap-1.5 pb-4">
                <Skeleton display="inline-block" h="3.5" w="6" />
                <SkeletonUserAvatarList count={2} size="sm" />
            </Card.Footer>
        </Card.Root>
    );
}

const outerStyles: { [Key in TRowState["type"]]?: string } = {
    // We no longer render the draggable item after we have left it
    // as it's space will be taken up by a shadow on adjacent items.
    // Using `display:none` rather than returning `null` so we can always
    // return refs from this component.
    // Keeping the refs allows us to continue to receive events during the drag.
    "is-dragging-and-left-self": "opacity-40",
};

const HOVER_DELAY = 500;

function BoardColumnCard({ card }: { card: ProjectCard.TModel }) {
    const { canDragAndDrop } = useBoard();
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<TRowState>(ROW_IDLE);
    const order = card.useField("order");
    const columnUID = card.useField("column_uid");

    useEffect(() => {
        if (!canDragAndDrop) {
            return;
        }

        const outer = outerRef.current;
        const inner = innerRef.current;
        invariant(outer && inner);

        return columnRowDndHelpers.row({
            row: card,
            symbolSet: BOARD_DND_SYMBOL_SET,
            draggable: inner,
            dropTarget: outer,
            setState,
            renderPreview({ container }) {
                // Demonstrating using a react portal to generate a preview
                const rect = inner.getBoundingClientRect();
                container.style.width = `${rect.width}px`;
                setState({
                    type: "preview",
                    container,
                    dragging: rect,
                });
            },
        });
    }, [card, order, columnUID]);

    return (
        <>
            <BoardColumnCardDisplay outerRef={outerRef} innerRef={innerRef} state={state} card={card} />
            {state.type === "preview" ? createPortal(<BoardColumnCardDisplay state={state} card={card} />, state.container) : null}
        </>
    );
}

function BoardColumnCardDisplay({
    card,
    state,
    outerRef,
    innerRef,
}: {
    card: ProjectCard.TModel;
    state: TRowState;
    outerRef?: React.Ref<HTMLDivElement | null>;
    innerRef?: React.Ref<HTMLDivElement | null>;
}) {
    const { selectCardViewType, currentCardUIDRef, isSelectedCard, isDisabledCard } = useBoardRelationshipController();
    const { filters, canDragAndDrop, navigateWithFilters } = useBoard();
    const description = card.useField("description");
    const projectMembers = card.useForeignField("project_members");
    const cardMemberUIDs = card.useField("member_uids");
    const cardMembers = useMemo(() => projectMembers.filter((member) => cardMemberUIDs.includes(member.uid)), [projectMembers, cardMemberUIDs]);
    const isHoverCardOpened = card.useField("isHoverCardOpened");
    const labels = card.useForeignField("labels");
    const checklists = ProjectChecklist.Model.useModels((model) => model.card_uid === card.uid);
    const { onPointerEnter: onCardPointerEnter, onPointerLeave: onCardPointerLeave } = useHoverEffect({
        isOpened: isHoverCardOpened ?? false,
        setIsOpened: (opened) => {
            if (state.type !== "idle") {
                return;
            }

            card.isHoverCardOpened = opened;
        },
        scopeAttr: HOVER_CARD_UID_ATTR,
        expectedScopeValue: card.uid,
        delay: HOVER_DELAY,
    });

    const canViewPreview =
        state.type === "idle" && (!!description.content.trim().length || !!cardMembers.length || !!labels.length || !!checklists.length);

    const setFilters = (relationshipType: ProjectCardRelationship.TRelationship) => {
        if (!filters[relationshipType]) {
            filters[relationshipType] = [];
        }

        if (filters[relationshipType].includes(card.uid)) {
            filters[relationshipType] = filters[relationshipType].filter((id) => id !== card.uid);
        } else {
            filters[relationshipType].push(card.uid);
        }

        navigateWithFilters();
    };

    const cardClassName = cn(
        "min-w-[theme(spacing.72)_+_theme(spacing.1)]",
        canDragAndDrop
            ? "cursor-pointer touch-none ring-primary hover:ring-2"
            : cn(
                  !selectCardViewType || !isDisabledCard(card.uid) ? "cursor-pointer hover:ring-2 ring-primary" : "cursor-not-allowed",
                  !!selectCardViewType && currentCardUIDRef.current === card.uid && "hidden",
                  !!selectCardViewType && isSelectedCard(card.uid) && "ring-2",
                  !!selectCardViewType && isDisabledCard(card.uid) && "opacity-30"
              ),
        ["is-dragging", "preview"].includes(state.type) && "ring-2"
    );

    return (
        <ModelRegistry.ProjectCard.Provider model={card} params={{ setFilters }}>
            <Flex gap="2" direction="col" className={outerStyles[state.type]}>
                {state.type === "is-over" && state.closestEdge === "top" ? <BoardColumnCardShadow dragging={state.dragging} /> : null}
                <Box
                    className={cardClassName}
                    onPointerEnter={onCardPointerEnter}
                    onPointerLeave={onCardPointerLeave}
                    {...{ [HOVER_CARD_UID_ATTR]: card.uid }}
                    ref={outerRef}
                >
                    <Popover.Root open={!!isHoverCardOpened && canViewPreview}>
                        <Popover.Trigger asChild>
                            <Box ref={innerRef} className="!w-[theme(spacing.72)_+_theme(spacing.1)]">
                                <BoardColumnCardCollapsible isDragging={state.type !== "idle"} />
                            </Box>
                        </Popover.Trigger>
                        <Popover.Content
                            side="right"
                            align="start"
                            className="w-64 max-w-[var(--radix-popper-available-width)] cursor-auto p-2.5 peer-first:hidden"
                            {...{ [DISABLE_DRAGGING_ATTR]: "", [HOVER_CARD_UID_ATTR]: card.uid }}
                        >
                            {state.type === "idle" && <BoardColumnCardPreview />}
                        </Popover.Content>
                    </Popover.Root>
                </Box>
                {state.type === "is-over" && state.closestEdge === "bottom" ? <BoardColumnCardShadow dragging={state.dragging} /> : null}
            </Flex>
        </ModelRegistry.ProjectCard.Provider>
    );
}

export function BoardColumnCardShadow({ dragging }: { dragging: DOMRect }) {
    return <Box rounded="xl" w="full" className="flex-shrink-0 bg-secondary/80" style={{ height: dragging.height }} />;
}

export default BoardColumnCard;
