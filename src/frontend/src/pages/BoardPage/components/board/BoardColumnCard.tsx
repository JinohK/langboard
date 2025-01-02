import { Box, Button, Card, Collapsible, Flex, HoverCard, IconComponent, ScrollArea, Skeleton } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import UserAvatarList, { SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import { Project, ProjectCard, ProjectCardRelationship } from "@/core/models";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";
import SelectRelationshipDialog from "@/pages/BoardPage/components/board/SelectRelationshipDialog";
import BoardColumnCardRelationship from "@/pages/BoardPage/components/board/BoardColumnCardRelationship";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";

export interface IBoardColumnCardProps {
    card: ProjectCard.TModel;
    closeHoverCardRef?: React.MutableRefObject<(() => void) | undefined>;
    isOverlay?: bool;
}

export interface IBoardColumnCardDragData extends ISortableDragData<ProjectCard.TModel> {
    type: "Card";
}

export const SkeletonBoardColumnCard = memo(() => {
    return (
        <Card.Root className="border-transparent shadow-transparent">
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
});

const BoardColumnCard = memo(({ card, closeHoverCardRef, isOverlay }: IBoardColumnCardProps) => {
    const { selectCardViewType, currentCardUIDRef, isSelectedCard, isDisabledCard } = useBoardRelationshipController();
    const { project, currentUser, hasRoleAction } = useBoard();
    const [isHoverCardOpened, setIsHoverCardOpened] = useState(false);
    const [isHoverCardHidden, setIsHoverCardHidden] = useState(false);
    const description = card.useField("description");
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

    useEffect(() => {
        card.isOpenedInBoardColumn = false;
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
    if (hasRoleAction(Project.ERoleAction.CARD_UPDATE) && !selectCardViewType) {
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
            className: cn(
                !selectCardViewType || !isDisabledCard(card.uid) ? "cursor-pointer hover:ring-2 ring-primary" : "cursor-not-allowed",
                !!selectCardViewType && currentCardUIDRef.current === card.uid && "hidden",
                !!selectCardViewType && isSelectedCard(card.uid) && "ring-2",
                !!selectCardViewType && isDisabledCard(card.uid) && "opacity-30"
            ),
        };
    }

    let cardInner = <BoardColumnCardInner isDragging={isDragging} card={card} setIsHoverCardHidden={setIsHoverCardHidden} />;

    if (!isOverlay && !isDragging && description?.content.trim().length) {
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
                    <Box>{cardInner}</Box>
                </HoverCard.Trigger>
                <HoverCard.Content
                    side="right"
                    align="end"
                    className="w-64 max-w-[var(--radix-popper-available-width)] cursor-auto p-0"
                    {...{ [DISABLE_DRAGGING_ATTR]: "" }}
                    hidden={isHoverCardHidden}
                >
                    <ScrollArea.Root>
                        <Box p="4" className="max-h-[calc(100vh-_theme(spacing.4))] break-all [&_img]:max-w-full">
                            <PlateEditor value={description} mentionableUsers={project.members} currentUser={currentUser} readOnly />
                        </Box>
                    </ScrollArea.Root>
                </HoverCard.Content>
            </HoverCard.Root>
        );
    }

    return <Box {...props}>{cardInner}</Box>;
});

interface IBoardColumnCardInnerProps {
    isDragging: bool;
    card: IBoardColumnCardProps["card"];
    setIsHoverCardHidden: React.Dispatch<React.SetStateAction<bool>>;
}

const BoardColumnCardInner = memo(({ isDragging, card, setIsHoverCardHidden }: IBoardColumnCardInnerProps) => {
    const { selectCardViewType, isDisabledCard } = useBoardRelationshipController();
    const { project, filters, navigateWithFilters } = useBoard();
    const [t] = useTranslation();
    const title = card.useField("title");
    const commentCount = card.useField("count_comment");
    const isOpenedInBoardColumn = card.useField("isOpenedInBoardColumn");
    const [isSelectRelationshipDialogOpened, setIsSelectRelationshipDialogOpened] = useState(false);

    const attributes = {
        [DISABLE_DRAGGING_ATTR]: "",
        onPointerEnter: (e: React.PointerEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest(`[${DISABLE_DRAGGING_ATTR}]`)) {
                setIsHoverCardHidden(true);
            }
        },
    };

    const openCard = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging || (e.target as HTMLElement)?.closest?.(`[${DISABLE_DRAGGING_ATTR}]`)) {
            return;
        }

        if (selectCardViewType) {
            if (isDisabledCard(card.uid)) {
                return;
            }

            setIsSelectRelationshipDialogOpened(true);
            return;
        }

        navigateWithFilters(ROUTES.BOARD.CARD(project.uid, card.uid));
    };

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

    return (
        <>
            <Card.Root
                id={`board-card-${card.uid}`}
                className={cn("relative", !!selectCardViewType && isDisabledCard(card.uid) ? "cursor-not-allowed" : "cursor-pointer")}
                onPointerOut={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest(`[${DISABLE_DRAGGING_ATTR}]`)) {
                        setIsHoverCardHidden(false);
                    }
                }}
                onClick={openCard}
            >
                <Collapsible.Root
                    open={isOpenedInBoardColumn}
                    onOpenChange={(opened) => {
                        card.isOpenedInBoardColumn = opened;
                    }}
                >
                    <Card.Header className="relative block space-y-0 py-4">
                        <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] break-all leading-tight">{title}</Card.Title>
                        <Collapsible.Trigger asChild>
                            <Button
                                variant="ghost"
                                className="absolute right-2.5 top-2.5 mt-0 transition-all [&[data-state=open]>svg]:rotate-180"
                                size="icon-sm"
                                title={t(`common.${isOpenedInBoardColumn ? "Collapse" : "Expand"}`)}
                                titleSide="top"
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
                        <BoardColumnCardRelationship card={card} setFilters={setFilters} attributes={attributes} />
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
            <SelectRelationshipDialog card={card} isOpened={isSelectRelationshipDialogOpened} setIsOpened={setIsSelectRelationshipDialogOpened} />
        </>
    );
});

export default BoardColumnCard;
