import { Box, Button, Flex, IconComponent, Tooltip } from "@/components/base";
import { ISortableDragData } from "@/core/hooks/useColumnRowSortable";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { Project, ProjectCard, ProjectCheckitem, User } from "@/core/models";
import { BoardCardCheckitemProvider } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCardCheckitemAssignedMember from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitemAssignedMember";
import BoardCardCheckitemCheckbox from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitemCheckbox";
import BoardCardCheckitemMore from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitemMore";
import BoardCardCheckitemTimer from "@/pages/BoardPage/components/card/checklist/BoardCardCheckitemTimer";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";

export interface IBoardCardCheckitemProps {
    checkitem: ProjectCheckitem.TModel;
    isOverlay?: bool;
}

interface IBoardCardCheckitemDragData extends ISortableDragData<ProjectCheckitem.TModel> {
    type: "Checkitem";
}

function BoardCardCheckitem({ checkitem, isOverlay }: IBoardCardCheckitemProps): JSX.Element {
    const { hasRoleAction } = useBoardCard();
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: checkitem.uid,
        data: {
            type: "Checkitem",
            data: checkitem,
        } satisfies IBoardCardCheckitemDragData,
        attributes: {
            roleDescription: "Checkitem",
        },
    });
    const canReorder = hasRoleAction(Project.ERoleAction.CardUpdate);

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    const variants = tv({
        base: cn(
            "ml-3 relative border-accent border-b-2 border-transparent",
            "after:content-[''] after:absolute after:-top-[calc(50%_+_2px)] after:left-0",
            "after:border-l after:border-b after:border-accent after:h-[calc(100%_+_2px)] after:w-3"
        ),
        variants: {
            dragging: {
                over: "border-primary/50 [&>div]:opacity-30",
                overlay: "ml-0 after:hidden",
            },
        },
    });

    let props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    if (canReorder) {
        props = {
            style,
            className: variants({
                dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
            }),
            ref: setNodeRef,
        };
    } else {
        props = {
            className: variants(),
        };
    }

    return (
        <Box {...props}>
            <BoardCardCheckitemInner checkitem={checkitem} attributes={attributes} listeners={listeners} />
        </Box>
    );
}

interface IBoardCardSubCheckitemListProps {
    checkitem: ProjectCheckitem.TModel;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
}

const BoardCardCheckitemInner = memo(({ checkitem, attributes, listeners }: IBoardCardSubCheckitemListProps) => {
    const { projectUID, currentUser, hasRoleAction, sharedClassNames } = useBoardCard();
    const navigateRef = useRef(usePageNavigate());
    const [t] = useTranslation();
    const [isValidating, setIsValidating] = useState(false);
    const [isTitleOpened, setIsTitleOpened] = useState(false);
    const title = checkitem.useField("title");
    const isChecked = checkitem.useField("is_checked");
    const cardifiedCards = checkitem.useForeignField<ProjectCard.TModel>("cardified_card");
    const cardifiedCard = cardifiedCards[0];
    const assignedUsers = checkitem.useForeignField<User.TModel>("user");
    const assignedUser = assignedUsers[0];
    const canEdit = hasRoleAction(Project.ERoleAction.CardUpdate);
    const canEditCheckitem = (!assignedUser && hasRoleAction(Project.ERoleAction.CardUpdate)) || assignedUser.uid === currentUser.uid;

    const toCardifiedCard = () => {
        if (!cardifiedCard) {
            return;
        }

        navigateRef.current(ROUTES.BOARD.CARD(projectUID, cardifiedCard.uid));
    };

    return (
        <BoardCardCheckitemProvider
            checkitem={checkitem}
            canEditCheckitem={canEditCheckitem}
            isValidating={isValidating}
            setIsValidating={setIsValidating}
        >
            <Flex
                items="center"
                justify="between"
                gap="2"
                h={{
                    initial: "16",
                    md: "12",
                }}
                className="ml-2 w-[calc(100%_-_theme(spacing.2))] truncate"
            >
                <Flex items="center" gap="2" w="full" className="truncate">
                    <Flex items="center" gap="1">
                        {canEdit && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-5 sm:size-8"
                                title={t("common.Drag to reorder")}
                                disabled={isValidating}
                                {...attributes}
                                {...listeners}
                            >
                                <IconComponent icon="grip-vertical" size="4" />
                            </Button>
                        )}
                    </Flex>
                    <Flex
                        direction={{
                            initial: "col",
                            md: "row",
                        }}
                        items={{
                            md: "center",
                        }}
                        gap={{ initial: "0.5", md: "2" }}
                        w="full"
                        className="truncate"
                    >
                        <Flex items="center" justify="between">
                            <Flex items="center" gap="2">
                                <BoardCardCheckitemCheckbox key={`board-card-checkitem-checkbox-${checkitem.uid}`} />
                                {cardifiedCard && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        title={t("card.Go to cardified card")}
                                        size="icon-sm"
                                        className="h-8 w-5 sm:size-8"
                                        onClick={toCardifiedCard}
                                    >
                                        <IconComponent icon="square-chart-gantt" size="5" />
                                    </Button>
                                )}
                                {assignedUser && (
                                    <BoardCardCheckitemAssignedMember
                                        key={`board-card-checkitem-assigned-member-${checkitem.uid}`}
                                        assignedUser={assignedUser}
                                    />
                                )}
                            </Flex>
                            <Box display={{ initial: "block", md: "hidden" }}>
                                <BoardCardCheckitemTimer key={`board-card-checkitem-timer-${checkitem.uid}`} />
                            </Box>
                        </Flex>
                        <Tooltip.Provider delayDuration={Tooltip.DEFAULT_DURATION}>
                            <Tooltip.Root open={isTitleOpened} onOpenChange={setIsTitleOpened}>
                                <Tooltip.Trigger asChild onClick={() => setIsTitleOpened(!isTitleOpened)}>
                                    <span
                                        className={cn("truncate", cardifiedCard && "sm:pl-2", isChecked && "text-muted-foreground/70 line-through")}
                                    >
                                        {title}
                                    </span>
                                </Tooltip.Trigger>
                                <Tooltip.Content className={sharedClassNames.popoverContent}>{title}</Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    </Flex>
                </Flex>
                <Flex items="center" gap="1.5">
                    <Box display={{ initial: "hidden", md: "block" }}>
                        <BoardCardCheckitemTimer key={`board-card-checkitem-timer-${checkitem.uid}`} />
                    </Box>
                    {canEditCheckitem && <BoardCardCheckitemMore key={`board-card-checkitem-more-${checkitem.uid}`} />}
                </Flex>
            </Flex>
        </BoardCardCheckitemProvider>
    );
});

export default BoardCardCheckitem;
