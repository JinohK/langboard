import { Box, Button, Card, Checkbox, Collapsible, Flex, HoverCard, IconComponent, ScrollArea, Separator, Skeleton } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import { UserAvatarList, SkeletonUserAvatarList, UserAvatarBadgeList } from "@/components/UserAvatarList";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import { BotModel, Project, ProjectCard, ProjectCardRelationship, ProjectChecklist, ProjectLabel, User } from "@/core/models";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";
import SelectRelationshipDialog from "@/pages/BoardPage/components/board/SelectRelationshipDialog";
import BoardColumnCardRelationship from "@/pages/BoardPage/components/board/BoardColumnCardRelationship";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import { createShortUUID } from "@/core/utils/StringUtils";
import { LabelBadge, LabelModelBadge } from "@/components/LabelBadge";
import BoardLabelListItem from "@/pages/BoardPage/components/board/BoardLabelListItem";

export interface IBoardColumnCardProps {
    card: ProjectCard.TModel;
    closeHoverCardRef?: React.RefObject<(() => void) | null>;
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
    const { hasRoleAction } = useBoard();
    const [isHoverCardOpened, setIsHoverCardOpened] = useState(false);
    const [isHoverCardHidden, setIsHoverCardHidden] = useState(false);
    const description = card.useField("description");
    const cardMembers = card.useForeignField<User.TModel>("members");
    const labels = card.useForeignField<ProjectLabel.TModel>("labels");
    const checklists = card.useForeignField<ProjectChecklist.TModel>("checklists");
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
    if (hasRoleAction(Project.ERoleAction.CardUpdate) && !selectCardViewType) {
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

    let cardInner = <BoardColumnCardCollapsible isDragging={isDragging} card={card} setIsHoverCardHidden={setIsHoverCardHidden} />;

    if (!isOverlay && !isDragging && (description.content.trim().length || cardMembers.length || labels.length || checklists.length)) {
        cardInner = (
            <HoverCard.Root
                open={isHoverCardOpened}
                onOpenChange={(opened) => {
                    setIsHoverCardOpened(opened);
                    if (closeHoverCardRef) {
                        closeHoverCardRef.current = opened ? () => setIsHoverCardOpened(false) : null;
                    }
                }}
            >
                <HoverCard.Trigger asChild>
                    <Box>{cardInner}</Box>
                </HoverCard.Trigger>
                <HoverCard.Content
                    side="right"
                    align="end"
                    className="w-64 max-w-[var(--radix-popper-available-width)] cursor-auto p-2.5"
                    {...{ [DISABLE_DRAGGING_ATTR]: "" }}
                    hidden={isHoverCardHidden}
                >
                    <BoardColumnCardPreview card={card} />
                </HoverCard.Content>
            </HoverCard.Root>
        );
    }

    return <Box {...props}>{cardInner}</Box>;
});

interface IBoardColumnCardCollapsibleProps {
    isDragging: bool;
    card: IBoardColumnCardProps["card"];
    setIsHoverCardHidden: React.Dispatch<React.SetStateAction<bool>>;
}

const BoardColumnCardCollapsible = memo(({ isDragging, card, setIsHoverCardHidden }: IBoardColumnCardCollapsibleProps) => {
    const { selectCardViewType, selectedRelationshipUIDs, currentCardUIDRef, isDisabledCard } = useBoardRelationshipController();
    const { project, filters, cardsMap, globalRelationshipTypes, navigateWithFilters } = useBoard();
    const [t] = useTranslation();
    const title = card.useField("title");
    const commentCount = card.useField("count_comment");
    const isOpenedInBoardColumn = card.useField("isOpenedInBoardColumn");
    const cardRelationships = card.useForeignField<ProjectCardRelationship.TModel>("relationships");
    const labels = card.useForeignField<ProjectLabel.TModel>("labels");
    const [isSelectRelationshipDialogOpened, setIsSelectRelationshipDialogOpened] = useState(false);
    const selectedRelationship = useMemo(
        () => (selectCardViewType ? selectedRelationshipUIDs.find(([selectedCardUID]) => selectedCardUID === card.uid)?.[1] : undefined),
        [selectCardViewType, selectedRelationshipUIDs]
    );
    const presentableRelationships = useMemo(() => {
        const relationships: [string, string][] = [];

        const filteredRelationships = cardRelationships.filter((relationship) => {
            if (!globalRelationshipTypes.length) {
                return false;
            }

            if (filters.parents) {
                return filters.parents.includes(relationship.child_card_uid);
            } else if (filters.children) {
                return filters.children.includes(relationship.parent_card_uid);
            } else {
                return false;
            }
        });

        const selectedRelationshipType = selectedRelationship
            ? globalRelationshipTypes.find((relationship) => relationship.uid === selectedRelationship)
            : undefined;

        for (let i = 0; i < filteredRelationships.length; ++i) {
            const relationship = filteredRelationships[i];
            const relationshipType = relationship.relationship_type;
            if (relationshipType) {
                const isParent = relationship.parent_card_uid === card.uid;
                relationships.push([
                    cardsMap[isParent ? relationship.child_card_uid : relationship.parent_card_uid].title,
                    isParent ? relationshipType.child_name : relationshipType.parent_name,
                ]);
            }
        }

        if (selectedRelationshipType) {
            const isParent = selectCardViewType === "parents";
            relationships.push([
                cardsMap[currentCardUIDRef.current!].title,
                isParent ? selectedRelationshipType.parent_name : selectedRelationshipType.child_name,
            ]);
        }

        return relationships;
    }, [globalRelationshipTypes, filters, cardRelationships, selectedRelationship]);

    useEffect(() => {
        if (selectCardViewType) {
            if (selectedRelationship) {
                card.isOpenedInBoardColumn = true;
            }
        }
    }, [selectCardViewType]);

    useEffect(() => {
        if (presentableRelationships.length) {
            card.isOpenedInBoardColumn = true;
        }
    }, [filters]);

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
                        {isOpenedInBoardColumn && !!labels.length && (
                            <Flex items="center" gap="1" mb="1.5" wrap>
                                {labels.map((label) => (
                                    <LabelModelBadge key={`board-card-label-${label.uid}`} model={label} />
                                ))}
                            </Flex>
                        )}
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
                        {!!presentableRelationships.length && (
                            <Card.Content className="px-6 pb-4">
                                {presentableRelationships.map(([relatedCardTitle, relationshipName]) => (
                                    <Flex key={createShortUUID()} items="center" gap="2" className="truncate text-accent-foreground/70">
                                        <span>{relationshipName}</span>
                                        <span className="text-muted-foreground">&gt;</span>
                                        <span className="truncate">{relatedCardTitle}</span>
                                    </Flex>
                                ))}
                            </Card.Content>
                        )}
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

interface IBoardColumnCardPreviewProps {
    card: ProjectCard.TModel;
}

const BoardColumnCardPreview = memo(({ card }: IBoardColumnCardPreviewProps) => {
    const { project, currentUser } = useBoard();
    const projectMembers = project.useForeignField<User.TModel>("members");
    const projectBots = project.useForeignField<BotModel.TModel>("bots");
    const mentionables = useMemo(() => [...projectMembers, ...projectBots.map((bot) => bot.as_user)], [projectMembers, projectBots]);
    const description = card.useField("description");
    const cardMembers = card.useForeignField<User.TModel>("members");
    const labels = card.useForeignField<ProjectLabel.TModel>("labels");
    const flatChecklists = card.useForeignField<ProjectChecklist.TModel>("checklists");
    const checklists = useMemo(() => flatChecklists.sort((a, b) => a.order - b.order).slice(0, 3), [flatChecklists]);
    const [isOpened, setIsOpened] = useState(false);

    return (
        <Flex direction="col" gap="1.5">
            {!!labels.length && (
                <Flex items="center" gap="1.5">
                    {labels.slice(0, 2).map((label) => (
                        <LabelModelBadge key={`board-card-preview-label-${label.uid}`} model={label} />
                    ))}
                    {labels.length > 2 && (
                        <HoverCard.Root open={isOpened} onOpenChange={setIsOpened}>
                            <HoverCard.Trigger asChild>
                                <Box cursor="pointer" onClick={() => setIsOpened(!isOpened)}>
                                    <LabelBadge
                                        name={`+${labels.length - 2}`}
                                        color="hsl(var(--secondary))"
                                        textColor="hsl(var(--secondary-foreground))"
                                        noTooltip
                                    />
                                </Box>
                            </HoverCard.Trigger>
                            <HoverCard.Content className="z-50 w-auto p-0" align="end">
                                <ScrollArea.Root>
                                    <Box maxH="52" minW="40" py="1">
                                        {labels.slice(2).map((label, i) => (
                                            <Fragment key={`board-card-preview-label-${label.uid}`}>
                                                {i !== 0 && <Separator className="my-1 h-px bg-muted" />}
                                                <BoardLabelListItem label={label} />
                                            </Fragment>
                                        ))}
                                    </Box>
                                </ScrollArea.Root>
                            </HoverCard.Content>
                        </HoverCard.Root>
                    )}
                </Flex>
            )}
            {!!cardMembers.length && <UserAvatarBadgeList users={cardMembers} maxVisible={2} listAlign="start" />}
            {!!description.content.trim().length && (
                <ScrollArea.Root>
                    <Box p="4" className="max-h-48 break-all [&_img]:max-w-full">
                        <PlateEditor value={description} mentionables={mentionables} currentUser={currentUser} readOnly />
                    </Box>
                </ScrollArea.Root>
            )}
            {!!checklists.length && (
                <Box>
                    {checklists.map((checklist) => (
                        <Flex key={`board-card-preview-checklist-${checklist.uid}`} items="center" gap="1.5">
                            <BoardColumnCardPreviewChecklist checklist={checklist} />
                        </Flex>
                    ))}
                    {flatChecklists.length > 1 && (
                        <Box mt="-2" ml="0.5">
                            ...
                        </Box>
                    )}
                </Box>
            )}
        </Flex>
    );
});

const BoardColumnCardPreviewChecklist = memo(({ checklist }: { checklist: ProjectChecklist.TModel }) => {
    const isChecked = checklist.useField("is_checked");

    return (
        <Flex items="center" gap="1.5">
            <Checkbox checked={isChecked} disabled />
            <span className="text-sm">{checklist.title}</span>
        </Flex>
    );
});

export default BoardColumnCard;
