"use client";

import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import invariant from "tiny-invariant";
import { type Edge, attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { getCardData, getCardDropTargetData, HOVER_CARD_UID_ATTR, isCardData, isDraggingACard } from "@/pages/BoardPage/components/board/BoardData";
import { ProjectCard, ProjectCardRelationship, ProjectChecklist, ProjectLabel, User } from "@/core/models";
import { Box, Card, Popover, Skeleton } from "@/components/base";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import useHoverEffect from "@/core/hooks/useHoverEffect";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import BoardColumnCardPreview from "@/pages/BoardPage/components/board/BoardColumnCardPreview";
import BoardColumnCardCollapsible from "@/pages/BoardPage/components/board/BoardColumnCardCollapsible";
import { cn } from "@/core/utils/ComponentUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { SkeletonUserAvatarList } from "@/components/UserAvatarList";

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

type TCardState =
    | {
          type: "idle";
      }
    | {
          type: "is-dragging";
      }
    | {
          type: "is-dragging-and-left-self";
      }
    | {
          type: "is-over";
          dragging: DOMRect;
          closestEdge: Edge;
      }
    | {
          type: "preview";
          container: HTMLElement;
          dragging: DOMRect;
      };

const idle: TCardState = { type: "idle" };

const outerStyles: { [Key in TCardState["type"]]?: string } = {
    // We no longer render the draggable item after we have left it
    // as it's space will be taken up by a shadow on adjacent items.
    // Using `display:none` rather than returning `null` so we can always
    // return refs from this component.
    // Keeping the refs allows us to continue to receive events during the drag.
    "is-dragging-and-left-self": "hidden",
};

const HOVER_DELAY = 500;

function BoardColumnCard({ card }: { card: ProjectCard.TModel }) {
    const { canDragAndDrop } = useBoard();
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<TCardState>(idle);
    const order = card.useField("order");
    const columnUID = card.useField("column_uid");

    useEffect(() => {
        if (!canDragAndDrop) {
            return;
        }

        const outer = outerRef.current;
        const inner = innerRef.current;
        invariant(outer && inner);

        return combine(
            draggable({
                element: inner,
                getInitialData: ({ element }) => getCardData({ card, rect: element.getBoundingClientRect() }),
                onGenerateDragPreview({ nativeSetDragImage, location, source }) {
                    const data = source.data;
                    invariant(isCardData(data));
                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: preserveOffsetOnSource({ element: inner, input: location.current.input }),
                        render({ container }) {
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
                },
                onDragStart() {
                    setState({ type: "is-dragging" });
                },
                onDrop() {
                    setState(idle);
                },
            }),
            dropTargetForElements({
                element: outer,
                getIsSticky: () => true,
                canDrop: isDraggingACard,
                getData: ({ element, input }) => {
                    const data = getCardDropTargetData({ card });
                    return attachClosestEdge(data, { element, input, allowedEdges: ["top", "bottom"] });
                },
                onDragEnter({ source, self }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.card.uid === card.uid) {
                        return;
                    }
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) {
                        return;
                    }

                    setState({ type: "is-over", dragging: source.data.rect, closestEdge });
                },
                onDrag({ source, self }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.card.uid === card.uid) {
                        return;
                    }
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) {
                        return;
                    }
                    // optimization - Don't update react state if we don't need to.
                    const proposed: TCardState = { type: "is-over", dragging: source.data.rect, closestEdge };
                    setState((current) => {
                        if (TypeUtils.isShallowEqual(proposed, current)) {
                            return current;
                        }
                        return proposed;
                    });
                },
                onDragLeave({ source }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.card.uid === card.uid) {
                        setState({ type: "is-dragging-and-left-self" });
                        return;
                    }
                    setState(idle);
                },
                onDrop() {
                    setState(idle);
                },
            })
        );
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
    state: TCardState;
    outerRef?: React.Ref<HTMLDivElement | null>;
    innerRef?: React.Ref<HTMLDivElement | null>;
}) {
    const { selectCardViewType, currentCardUIDRef, isSelectedCard, isDisabledCard } = useBoardRelationshipController();
    const { filters, canDragAndDrop, navigateWithFilters } = useBoard();
    const description = card.useField("description");
    const cardMembers = card.useForeignField<User.TModel>("members");
    const isHoverCardOpened = card.useField("isHoverCardOpened");
    const labels = card.useForeignField<ProjectLabel.TModel>("labels");
    const checklists = card.useForeignField<ProjectChecklist.TModel>("checklists");
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
        ["is-dragging", "preview"].includes(state.type) && "ring-2",
        outerStyles[state.type]
    );

    return (
        <ModelRegistry.ProjectCard.Provider model={card} params={{ setFilters }}>
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
                        className="w-64 max-w-[var(--radix-popper-available-width)] cursor-auto p-2.5"
                        {...{ [DISABLE_DRAGGING_ATTR]: "", [HOVER_CARD_UID_ATTR]: card.uid }}
                    >
                        {state.type === "idle" && <BoardColumnCardPreview />}
                    </Popover.Content>
                </Popover.Root>
            </Box>
            {state.type === "is-over" && state.closestEdge === "bottom" ? <BoardColumnCardShadow dragging={state.dragging} /> : null}
        </ModelRegistry.ProjectCard.Provider>
    );
}

export function BoardColumnCardShadow({ dragging }: { dragging: DOMRect }) {
    return <Box rounded w="72" className="flex-shrink-0 bg-slate-900" style={{ height: dragging.height }} />;
}

export default BoardColumnCard;
