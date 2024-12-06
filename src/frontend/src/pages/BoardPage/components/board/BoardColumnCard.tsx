import { Button, Card, Collapsible, Flex, HoverCard, IconComponent, ScrollArea, Skeleton } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import UserAvatarList, { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import useCardCommentAddedHandlers from "@/controllers/socket/card/comment/useCardCommentAddedHandlers";
import useCardCommentDeletedHandlers from "@/controllers/socket/card/comment/useCardCommentDeletedHandlers";
import useCardDescriptionChangedHandlers from "@/controllers/socket/card/useCardDescriptionChangedHandlers";
import useCardTitleChangedHandlers from "@/controllers/socket/card/useCardTitleChangedHandlers";
import { Project, ProjectCard } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { StringCase } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { memo, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

export interface IBoardColumnCardProps {
    card: ProjectCard.IBoard & {
        isOpenedRef?: React.MutableRefObject<bool>;
    };
    closeHoverCardRef?: React.MutableRefObject<(() => void) | undefined>;
    isOverlay?: bool;
}

export interface IBoardColumnCardDragData {
    type: "Card";
    data: IBoardColumnCardProps["card"];
}

export const SkeletonBoardColumnCard = memo(() => {
    return (
        <Card.Root className="border-transparent shadow-transparent">
            <Card.Header className="relative block py-4">
                <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">
                    <Skeleton className="inline-block h-4 w-3/4" />
                </Card.Title>
                <Skeleton className="absolute right-2.5 top-1 mt-0 inline-block size-8 rounded-md" />
            </Card.Header>
            <Card.Content></Card.Content>
            <Card.Footer className="flex items-end justify-between gap-1.5 pb-4">
                <Skeleton className="inline-block h-3.5 w-6" />
                <SkeletonUserAvatarList count={2} size="sm" />
            </Card.Footer>
        </Card.Root>
    );
});

const DISABLE_DRAGGING_ATTR = "data-drag-disabled";

const BoardColumnCard = memo(({ card, closeHoverCardRef, isOverlay }: IBoardColumnCardProps) => {
    const { project, currentUser, socket, hasRoleAction } = useBoard();
    if (TypeUtils.isNullOrUndefined(card.isOpenedRef)) {
        card.isOpenedRef = useRef(false);
    }
    const [isHoverCardOpened, setIsHoverCardOpened] = useState(false);
    const [isHoverCardHidden, setIsHoverCardHidden] = useState(false);
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const isClickedRef = useRef(false);
    const { on: onCardDescriptionChanged } = useCardDescriptionChangedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            card.description = data.description;
            forceUpdate();
        },
    });
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: card.uid,
        data: {
            type: "Card",
            data: card,
        } satisfies IBoardColumnCardDragData,
        attributes: {
            roleDescription: "Card",
        },
    });
    const onPointerStart = useCallback(
        (type: "mouse" | "touch") => (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
            if ((e.target as HTMLElement)?.closest?.(`[${DISABLE_DRAGGING_ATTR}]`)) {
                return;
            }

            const upEvent = type === "mouse" ? "mouseup" : "touchend";
            const targetListener = type === "mouse" ? "onMouseDown" : "onTouchStart";

            const checkIsClick = () => {
                isClickedRef.current = true;
                window.removeEventListener(upEvent, checkIsClick);
            };

            window.addEventListener(upEvent, checkIsClick);

            setTimeout(() => {
                if (isClickedRef.current) {
                    return;
                }

                window.removeEventListener(upEvent, checkIsClick);
                listeners?.[targetListener]?.(e);
            }, 150);
        },
        []
    );
    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        if ((e.target as HTMLElement)?.closest?.(`[${DISABLE_DRAGGING_ATTR}]`)) {
            return;
        }

        listeners?.onKeyDown?.(e);
    }, []);

    useEffect(() => {
        const { off } = onCardDescriptionChanged();

        return () => {
            off();
        };
    }, []);

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: "cursor-pointer hover:ring-2 ring-primary",
        variants: {
            dragging: {
                over: "ring-2 opacity-30",
                overlay: "ring-2",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (hasRoleAction(Project.ERoleAction.CARD_UPDATE)) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            onMouseDown: onPointerStart("mouse"),
            onTouchStart: onPointerStart("touch"),
            onKeyDown,
            ...attributes,
            ref: setNodeRef,
        };
    } else {
        props = {
            className: "cursor-pointer hover:ring-2 ring-primary",
        };
    }

    let cardInner = <BoardColumnCardInner isClickedRef={isClickedRef} card={card} setIsHoverCardHidden={setIsHoverCardHidden} />;

    if (!isOverlay && !isDragging && card.description?.content.trim().length) {
        cardInner = (
            <HoverCard.Root
                open={isHoverCardOpened}
                onOpenChange={(opened) => {
                    setIsHoverCardOpened(opened);
                    if (closeHoverCardRef) {
                        closeHoverCardRef.current = opened ? () => setIsHoverCardOpened(false) : undefined;
                    }
                }}
            >
                <HoverCard.Trigger asChild>
                    <div>{cardInner}</div>
                </HoverCard.Trigger>
                <HoverCard.Content
                    side="right"
                    align="end"
                    className="w-64 max-w-[var(--radix-popper-available-width)] cursor-auto p-0"
                    {...{ [DISABLE_DRAGGING_ATTR]: "" }}
                    hidden={isHoverCardHidden}
                >
                    <ScrollArea.Root>
                        <div className="max-h-[calc(100vh-_theme(spacing.4))] break-all p-4 [&_img]:max-w-full">
                            <PlateEditor value={card.description} mentionableUsers={project.members} currentUser={currentUser} readOnly />
                        </div>
                    </ScrollArea.Root>
                </HoverCard.Content>
            </HoverCard.Root>
        );
    }

    return <div {...props}>{cardInner}</div>;
});

interface IBoardColumnCardInnerProps {
    card: IBoardColumnCardProps["card"];
    isClickedRef: React.MutableRefObject<bool>;
    setIsHoverCardHidden: React.Dispatch<React.SetStateAction<bool>>;
}

const BoardColumnCardInner = memo(({ card, isClickedRef, setIsHoverCardHidden }: IBoardColumnCardInnerProps) => {
    const { project, socket, filters, hasRoleAction, navigateWithFilters } = useBoard();
    const [t] = useTranslation();
    const [title, setTitle] = useState(card.title);
    const [commentCount, setCommentCount] = useState(card.count_comment);
    const [isOpened, setIsOpened] = useState(card.isOpenedRef!.current);
    const { on: onCardTitleChanged } = useCardTitleChangedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            card.title = data.title;
            setTitle(data.title);
        },
    });
    const { on: onCardCommentAdded } = useCardCommentAddedHandlers({
        socket,
        cardUID: card.uid,
        callback: () => {
            setCommentCount((count) => {
                card.count_comment = count + 1;
                return card.count_comment;
            });
        },
    });
    const { on: onCardCommentDeleted } = useCardCommentDeletedHandlers({
        socket,
        cardUID: card.uid,
        callback: () => {
            setCommentCount((count) => {
                card.count_comment = count - 1;
                return card.count_comment;
            });
        },
    });
    const attributes = {
        [DISABLE_DRAGGING_ATTR]: "",
        onPointerEnter: (e: React.PointerEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest(`[${DISABLE_DRAGGING_ATTR}]`)) {
                setIsHoverCardHidden(true);
            }
        },
    };

    useEffect(() => {
        const { off: offCardTitleChanged } = onCardTitleChanged();
        const { off: offCardCommentAdded } = onCardCommentAdded();
        const { off: offCardCommentDeleted } = onCardCommentDeleted();

        return () => {
            offCardTitleChanged();
            offCardCommentAdded();
            offCardCommentDeleted();
        };
    }, []);

    const openCard = (e: React.MouseEvent<HTMLDivElement>) => {
        setTimeout(() => {
            if (!isClickedRef.current && hasRoleAction(Project.ERoleAction.CARD_UPDATE)) {
                return;
            }

            if ((e.target as HTMLElement)?.closest?.(`[${DISABLE_DRAGGING_ATTR}]`)) {
                return;
            }

            isClickedRef.current = false;
            navigateWithFilters(ROUTES.BOARD.CARD(project.uid, card.uid));
        }, 150);
    };

    const setFilters = (relationshipType: keyof ProjectCard.IBoard["relationships"]) => {
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

    return (
        <Card.Root
            className="relative cursor-pointer"
            onPointerOut={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest(`[${DISABLE_DRAGGING_ATTR}]`)) {
                    setIsHoverCardHidden(false);
                }
            }}
            onClick={openCard}
        >
            <Collapsible.Root
                open={isOpened}
                onOpenChange={(opened) => {
                    setIsOpened(opened);
                    card.isOpenedRef!.current = opened;
                }}
            >
                <Card.Header className="relative block py-4">
                    <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] leading-tight">{title}</Card.Title>
                    <Collapsible.Trigger asChild>
                        <Button
                            variant="ghost"
                            className="absolute right-2.5 top-1 mt-0 transition-all [&[data-state=open]>svg]:rotate-180"
                            size="icon-sm"
                            title={t(`common.${isOpened ? "Collapse" : "Expand"}`)}
                            titleSide="bottom"
                            {...attributes}
                        >
                            <IconComponent icon="chevron-down" size="4" />
                        </Button>
                    </Collapsible.Trigger>
                </Card.Header>
                <Collapsible.Content
                    className={cn(
                        "overflow-hidden text-sm transition-all",
                        "data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down"
                    )}
                >
                    <Card.Content>
                        {(["parents", "children"] as (keyof ProjectCard.IBoard["relationships"])[]).map((relationshipType) => {
                            const relationship = card.relationships[relationshipType];
                            if (!relationship.length) {
                                return null;
                            }

                            return (
                                <Button
                                    key={`board-card-relationship-button-${relationshipType}-${card.uid}`}
                                    size="icon-sm"
                                    className={cn(
                                        "absolute top-1/2 z-20 block -translate-y-1/2 transform rounded-full text-xs",
                                        relationshipType === "parents" ? "-left-3" : "-right-3"
                                    )}
                                    title={t(`project.${new StringCase(relationshipType).toPascal()}`)}
                                    titleSide={relationshipType === "parents" ? "right" : "left"}
                                    onClick={() => setFilters(relationshipType)}
                                    {...attributes}
                                >
                                    +{relationship.length}
                                </Button>
                            );
                        })}
                    </Card.Content>
                    <Card.Footer className="flex items-end justify-between gap-1.5 pb-4">
                        <Flex items="center" gap="2">
                            <IconComponent icon="message-square" size="4" className="text-secondary" strokeWidth="4" />
                            <span>{commentCount}</span>
                        </Flex>
                        <UserAvatarList maxVisible={3} users={card.members} size="sm" {...attributes} className="cursor-default" />
                    </Card.Footer>
                </Collapsible.Content>
            </Collapsible.Root>
        </Card.Root>
    );
});

export default BoardColumnCard;
