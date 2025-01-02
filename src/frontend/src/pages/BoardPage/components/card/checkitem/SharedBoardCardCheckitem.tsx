import { Box, Button, Collapsible, Flex, IconComponent, Tooltip } from "@/components/base";
import { IFlexProps } from "@/components/base/Flex";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { Project, ProjectCheckitem } from "@/core/models";
import { BoardCardCheckitemProvider } from "@/core/providers/BoardCardCheckitemProvider";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { cn } from "@/core/utils/ComponentUtils";
import SharedBoardCardCheckitemAddSub from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemAddSub";
import SharedBoardCardCheckitemAssignMember from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemAssignMember";
import SharedBoardCardCheckitemMore from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemMore";
import SharedBoardCardCheckitemTimer from "@/pages/BoardPage/components/card/checkitem/SharedBoardCardCheckitemTimer";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { forwardRef, memo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface IBaseSharedBoardCardCheckitemProps<TParent extends bool> extends IFlexProps {
    checkitem: ProjectCheckitem.TModel;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
    isParent?: TParent;
}

export interface ISharedBoardCardCheckitemWithCollapsibleProps extends IBaseSharedBoardCardCheckitemProps<true> {
    isParent: true;
}

export interface ISharedBoardCardCheckitemWithoutCollapsibleProps extends IBaseSharedBoardCardCheckitemProps<false> {
    isParent?: false;
}

export type TSharedBoardCardCheckitemProps = ISharedBoardCardCheckitemWithCollapsibleProps | ISharedBoardCardCheckitemWithoutCollapsibleProps;

const SharedBoardCardCheckitem = memo(
    forwardRef<HTMLDivElement, TSharedBoardCardCheckitemProps>(({ checkitem, attributes, listeners, isParent, ...props }, ref) => {
        const { projectUID, hasRoleAction, sharedClassNames } = useBoardCard();
        const isOpenedInBoardCard = checkitem.useField("isOpenedInBoardCard");
        const navigate = useRef(usePageNavigate());
        const [t] = useTranslation();
        const [isValidating, setIsValidating] = useState(false);
        const [isTitleOpened, setIsTitleOpened] = useState(false);
        const cardifiedUID = checkitem.useField("cardified_uid");
        const title = checkitem.useField("title");
        const canEdit = hasRoleAction(Project.ERoleAction.CARD_UPDATE);

        const toCardifiedCard = () => {
            if (!cardifiedUID) {
                return;
            }

            navigate.current(ROUTES.BOARD.CARD(projectUID, cardifiedUID));
        };

        return (
            <BoardCardCheckitemProvider checkitem={checkitem} isParent={isParent} isValidating={isValidating} setIsValidating={setIsValidating}>
                <Flex
                    items="center"
                    justify="between"
                    gap="2"
                    h={{
                        initial: "16",
                        md: "12",
                    }}
                    className={cn("truncate", isParent ? "w-full" : "w-[calc(100%_-_theme(spacing.4))]")}
                    {...props}
                    ref={ref}
                >
                    <Flex items="center" gap="2" w="full" className="truncate">
                        <Flex items="center" gap="1">
                            {hasRoleAction(Project.ERoleAction.CARD_UPDATE) && (
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
                            {isParent && (
                                <Collapsible.Trigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="h-8 w-6 transition-all sm:size-8 [&[data-state=open]>svg]:rotate-180"
                                        title={t(`common.${isOpenedInBoardCard ? "Collapse" : "Expand"}`)}
                                    >
                                        <IconComponent icon="chevron-down" size="4" />
                                    </Button>
                                </Collapsible.Trigger>
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
                            gap="0.5"
                            w="full"
                            className="truncate"
                        >
                            <Flex items="center" justify="between" gap="1" mr="1">
                                <Flex items="center" gap="1">
                                    {cardifiedUID && (
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
                                    <SharedBoardCardCheckitemAssignMember
                                        checkitem={checkitem}
                                        isValidating={isValidating}
                                        setIsValidating={setIsValidating}
                                    />
                                </Flex>
                                <Box display={{ initial: "block", md: "hidden" }}>
                                    <SharedBoardCardCheckitemTimer />
                                </Box>
                            </Flex>
                            <Tooltip.Provider delayDuration={400}>
                                <Tooltip.Root open={isTitleOpened} onOpenChange={setIsTitleOpened}>
                                    <Tooltip.Trigger asChild onClick={() => setIsTitleOpened(!isTitleOpened)}>
                                        <span className={cn("truncate", cardifiedUID && "sm:pl-2")}>{title}</span>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content className={sharedClassNames.popoverContent}>{title}</Tooltip.Content>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                        </Flex>
                    </Flex>
                    <Flex items="center" gap="1.5">
                        <Box display={{ initial: "hidden", md: "block" }}>
                            <SharedBoardCardCheckitemTimer />
                        </Box>
                        {canEdit && (
                            <Flex items="center">
                                {isParent && <SharedBoardCardCheckitemAddSub />}
                                <SharedBoardCardCheckitemMore />
                            </Flex>
                        )}
                    </Flex>
                </Flex>
            </BoardCardCheckitemProvider>
        );
    })
);

export default SharedBoardCardCheckitem;
