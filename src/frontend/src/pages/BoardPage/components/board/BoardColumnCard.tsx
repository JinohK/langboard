import { Box, Button, Card, Collapsible, Flex, IconComponent, Popover, Skeleton } from "@/components/base";
import { UserAvatarList, SkeletonUserAvatarList } from "@/components/UserAvatarList";
import { DISABLE_DRAGGING_ATTR } from "@/constants";
import { Project, ProjectCard, ProjectCardRelationship, ProjectChecklist, ProjectLabel, User } from "@/core/models";
import { useBoardRelationshipController } from "@/core/providers/BoardRelationshipController";
import { useBoard } from "@/core/providers/BoardProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";
import SelectRelationshipDialog from "@/pages/BoardPage/components/board/SelectRelationshipDialog";
import BoardColumnCardRelationship from "@/pages/BoardPage/components/board/BoardColumnCardRelationship";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import { createShortUUID } from "@/core/utils/StringUtils";
import { LabelModelBadge } from "@/components/LabelBadge";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { IBoardColumnCardContextParams } from "@/pages/BoardPage/components/board/types";
import useHoverEffect from "@/core/hooks/useHoverEffect";
import BoardColumnCardPreview from "@/pages/BoardPage/components/board/BoardColumnCardPreview";

export interface IBoardColumnCardProps {
    card: ProjectCard.TModel;
    isOverlay?: bool;
}

export interface IBoardColumnCardDragData extends ISortableDragData<ProjectCard.TModel> {
    type: "Card";
}

export function SkeletonBoardColumnCard() {
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
}

const HOVER_DELAY = 500;
const HOVER_CARD_UID_ATTR = "data-card-uid";

const BoardColumnCardVariants = tv({
    base: "cursor-pointer hover:ring-2 ring-primary touch-none",
    variants: {
        dragging: {
            over: "ring-2 opacity-30",
            overlay: "ring-2",
        },
    },
});

function BoardColumnCard({ card, isOverlay }: IBoardColumnCardProps) {
    const { selectCardViewType, currentCardUIDRef, isSelectedCard, isDisabledCard } = useBoardRelationshipController();
    const { filters, hasRoleAction, navigateWithFilters } = useBoard();
    const description = card.useField("description");
    const cardMembers = card.useForeignField<User.TModel>("members");
    const [isCollapseOpened, setIsCollapseOpened] = useState(false);
    const isHoverCardOpened = card.useField("isHoverCardOpened");
    const labels = card.useForeignField<ProjectLabel.TModel>("labels");
    const checklists = card.useForeignField<ProjectChecklist.TModel>("checklists");
    const { onPointerEnter: onCardPointerEnter, onPointerLeave: onCardPointerLeave } = useHoverEffect({
        isOpened: isHoverCardOpened,
        setIsOpened: (opened) => {
            card.isHoverCardOpened = opened;
        },
        scopeAttr: HOVER_CARD_UID_ATTR,
        expectedScopeValue: card.uid,
        delay: HOVER_DELAY,
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

            const targetListener = type === "mouse" ? "onMouseDown" : "onTouchStart";

            listeners?.[targetListener]?.(e);
        },
        [listeners]
    );
    const onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLElement>) => {
            if ((e.target as HTMLElement)?.closest?.(`[${DISABLE_DRAGGING_ATTR}]`)) {
                return;
            }

            listeners?.onKeyDown?.(e);
        },
        [listeners]
    );
    const props = useMemo<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>(() => {
        let newProps: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> = {
            onPointerEnter: onCardPointerEnter,
            onPointerLeave: onCardPointerLeave,
        };
        if (hasRoleAction(Project.ERoleAction.CardUpdate) && !selectCardViewType) {
            newProps = {
                ...newProps,
                style: {
                    transition,
                    transform: CSS.Translate.toString(transform),
                },
                className: BoardColumnCardVariants({
                    dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
                }),
                onMouseDown: onPointerStart("mouse"),
                onTouchStart: onPointerStart("touch"),
                onKeyDown,
                ...attributes,
                ref: setNodeRef,
            };
        } else {
            newProps = {
                ...newProps,
                className: cn(
                    !selectCardViewType || !isDisabledCard(card.uid) ? "cursor-pointer hover:ring-2 ring-primary" : "cursor-not-allowed",
                    !!selectCardViewType && currentCardUIDRef.current === card.uid && "hidden",
                    !!selectCardViewType && isSelectedCard(card.uid) && "ring-2",
                    !!selectCardViewType && isDisabledCard(card.uid) && "opacity-30"
                ),
            };
        }
        return newProps;
    }, [
        transition,
        transform,
        onPointerStart,
        onKeyDown,
        attributes,
        setNodeRef,
        hasRoleAction,
        selectCardViewType,
        isDisabledCard,
        isSelectedCard,
        isDragging,
        isOverlay,
    ]);

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

    const canViewPreview =
        !isOverlay && !isDragging && (!!description.content.trim().length || !!cardMembers.length || !!labels.length || !!checklists.length);

    return (
        <ModelRegistry.ProjectCard.Provider model={card} params={{ HOVER_CARD_UID_ATTR, isCollapseOpened, setIsCollapseOpened, setFilters }}>
            <Box {...props} {...{ [HOVER_CARD_UID_ATTR]: card.uid }}>
                <Popover.Root open={isHoverCardOpened && canViewPreview}>
                    <Popover.Trigger asChild>
                        <Box>
                            <BoardColumnCardCollapsible isDragging={isDragging} labels={labels} />
                        </Box>
                    </Popover.Trigger>
                    <Popover.Content
                        side="right"
                        align="start"
                        className="w-64 max-w-[var(--radix-popper-available-width)] cursor-auto p-2.5"
                        {...{ [DISABLE_DRAGGING_ATTR]: "", [HOVER_CARD_UID_ATTR]: card.uid }}
                    >
                        <BoardColumnCardPreview labels={labels} cardMembers={cardMembers} checklists={checklists} />
                    </Popover.Content>
                </Popover.Root>
            </Box>
        </ModelRegistry.ProjectCard.Provider>
    );
}
BoardColumnCard.displayName = "Board.ColumnCard";

interface IBoardColumnCardCollapsibleProps {
    isDragging: bool;
    labels: ProjectLabel.TModel[];
}

function BoardColumnCardCollapsible({ isDragging, labels }: IBoardColumnCardCollapsibleProps) {
    const { selectCardViewType, selectedRelationshipUIDs, currentCardUIDRef, isDisabledCard } = useBoardRelationshipController();
    const { project, filters, cardsMap, globalRelationshipTypes, navigateWithFilters } = useBoard();
    const [t] = useTranslation();
    const { model: card, params } = ModelRegistry.ProjectCard.useContext<IBoardColumnCardContextParams>();
    const { isCollapseOpened, setIsCollapseOpened } = params;
    const title = card.useField("title");
    const commentCount = card.useField("count_comment");
    const cardRelationships = card.useForeignField<ProjectCardRelationship.TModel>("relationships");
    const [isSelectRelationshipDialogOpened, setIsSelectRelationshipDialogOpened] = useState(false);
    const selectedRelationship = useMemo(
        () => (selectCardViewType ? selectedRelationshipUIDs.find(([selectedCardUID]) => selectedCardUID === card.uid)?.[1] : undefined),
        [selectCardViewType, selectedRelationshipUIDs]
    );
    const openCard = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
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
        },
        [isDragging, selectCardViewType, isDisabledCard, setIsSelectRelationshipDialogOpened]
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

        if (selectedRelationshipType && currentCardUIDRef.current) {
            const isParent = selectCardViewType === "parents";
            relationships.push([
                cardsMap[currentCardUIDRef.current].title,
                isParent ? selectedRelationshipType.parent_name : selectedRelationshipType.child_name,
            ]);
        }

        return relationships;
    }, [globalRelationshipTypes, filters, cardRelationships, selectedRelationship]);

    useEffect(() => {
        if (selectCardViewType && selectedRelationship) {
            setIsCollapseOpened(true);
        }
    }, [selectCardViewType]);

    useEffect(() => {
        if (presentableRelationships.length) {
            setIsCollapseOpened(true);
        }
    }, [filters]);

    const attributes = {
        [DISABLE_DRAGGING_ATTR]: "",
    };

    const handleOpenCollapsible = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCollapseOpened(!isCollapseOpened);
        setTimeout(() => {
            card.isHoverCardOpened = true;
        }, 0);
    };

    return (
        <>
            <Card.Root
                id={`board-card-${card.uid}`}
                className={cn("relative", !!selectCardViewType && isDisabledCard(card.uid) ? "cursor-not-allowed" : "cursor-pointer")}
                onClick={openCard}
            >
                <Collapsible.Root open={isCollapseOpened} onOpenChange={setIsCollapseOpened}>
                    <Card.Header className="relative block space-y-0 py-4">
                        {isCollapseOpened && !!labels.length && (
                            <Flex items="center" gap="1" mb="1.5" wrap>
                                {labels.map((label) => (
                                    <LabelModelBadge key={`board-card-label-${label.uid}`} model={label} />
                                ))}
                            </Flex>
                        )}
                        <Card.Title className="max-w-[calc(100%_-_theme(spacing.8))] break-all leading-tight">{title}</Card.Title>
                        <Button
                            variant="ghost"
                            className="absolute right-2.5 top-2.5 mt-0"
                            size="icon-sm"
                            title={t(`common.${isCollapseOpened ? "Collapse" : "Expand"}`)}
                            titleSide="top"
                            onClick={handleOpenCollapsible}
                            {...attributes}
                        >
                            <IconComponent icon="chevron-down" size="4" className={cn("transition-all", isCollapseOpened && "rotate-180")} />
                        </Button>
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
                        <BoardColumnCardRelationship attributes={attributes} />
                        <Card.Footer className="flex items-end justify-between gap-1.5 pb-4">
                            <Flex items="center" gap="2">
                                <IconComponent icon="message-square" size="4" className="text-secondary" strokeWidth="4" />
                                <span>{commentCount}</span>
                            </Flex>
                            <UserAvatarList
                                maxVisible={3}
                                users={card.members}
                                projectUID={project.uid}
                                size="sm"
                                {...attributes}
                                className="cursor-default"
                            />
                        </Card.Footer>
                    </Collapsible.Content>
                </Collapsible.Root>
            </Card.Root>
            <SelectRelationshipDialog isOpened={isSelectRelationshipDialogOpened} setIsOpened={setIsSelectRelationshipDialogOpened} />
        </>
    );
}
BoardColumnCardCollapsible.displayName = "Board.ColumnCard.Collapsible";

export default BoardColumnCard;
