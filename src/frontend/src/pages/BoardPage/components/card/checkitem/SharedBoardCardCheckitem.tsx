import { Button, Collapsible, Flex, IconComponent, Tooltip } from "@/components/base";
import { IFlexProps } from "@/components/base/Flex";
import useCardCheckitemCardifiedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemCardifiedHandlers";
import useCardCheckitemTimerStartedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStartedHandlers";
import useCardCheckitemTimerStoppedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTimerStoppedHandlers";
import useCardCheckitemTitleChangedHandlers from "@/controllers/socket/card/checkitem/useCardCheckitemTitleChangedHandlers";
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
import { forwardRef, memo, useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface IBaseSharedBoardCardCheckitemProps<TParent extends bool> extends IFlexProps {
    checkitem: ProjectCheckitem.IBaseBoard;
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
    isParent?: TParent;
    isOpenedRef?: React.MutableRefObject<bool>;
    deleted: (uid: string) => void;
}

export interface ISharedBoardCardCheckitemWithCollapsibleProps extends IBaseSharedBoardCardCheckitemProps<true> {
    isParent: true;
    isOpenedRef: React.MutableRefObject<bool>;
}

export interface ISharedBoardCardCheckitemWithoutCollapsibleProps extends IBaseSharedBoardCardCheckitemProps<false> {
    isParent?: false;
    isOpenedRef?: never;
}

export type TSharedBoardCardCheckitemProps = ISharedBoardCardCheckitemWithCollapsibleProps | ISharedBoardCardCheckitemWithoutCollapsibleProps;

const SharedBoardCardCheckitem = memo(
    forwardRef<HTMLDivElement, TSharedBoardCardCheckitemProps>(
        ({ checkitem, attributes, listeners, isParent, isOpenedRef, deleted, ...props }, ref) => {
            const { projectUID, socket, hasRoleAction, sharedClassNames } = useBoardCard();
            const navigate = useNavigate();
            const [t] = useTranslation();
            const [isValidating, setIsValidating] = useState(false);
            const [isTitleOpened, setIsTitleOpened] = useState(false);
            const canEdit = hasRoleAction(Project.ERoleAction.CARD_UPDATE);
            const [_, forceUpdate] = useReducer((x) => x + 1, 0);
            const { on: onCardCheckitemCardified } = useCardCheckitemCardifiedHandlers({
                socket,
                checkitemUID: checkitem.uid,
                callback: (data) => {
                    checkitem.cardified_uid = data.new_card.uid;
                    forceUpdate();
                },
            });
            const { on: onCardCheckitemTitleChanged } = useCardCheckitemTitleChangedHandlers({
                socket,
                checkitemUID: checkitem.uid,
                callback: (data) => {
                    checkitem.title = data.title;
                    forceUpdate();
                },
            });
            const { on: onCardCheckitemTimerStarted } = useCardCheckitemTimerStartedHandlers({
                socket,
                checkitemUID: checkitem.uid,
                callback: (data) => {
                    checkitem.timer = data.timer;
                    checkitem.acc_time_seconds = data.acc_time_seconds;
                    forceUpdate();
                },
            });
            const { on: onCardCheckitemTimerStopped } = useCardCheckitemTimerStoppedHandlers({
                socket,
                checkitemUID: checkitem.uid,
                callback: (data) => {
                    checkitem.timer = undefined;
                    checkitem.acc_time_seconds = data.acc_time_seconds;
                    forceUpdate();
                },
            });

            useEffect(() => {
                const { off: offCardCheckitemCardified } = onCardCheckitemCardified();
                const { off: offCardCheckitemTitleChanged } = onCardCheckitemTitleChanged();
                const { off: offCardCheckitemTimerStarted } = onCardCheckitemTimerStarted();
                const { off: offCardCheckitemTimerStopped } = onCardCheckitemTimerStopped();

                return () => {
                    offCardCheckitemCardified();
                    offCardCheckitemTitleChanged();
                    offCardCheckitemTimerStarted();
                    offCardCheckitemTimerStopped();
                };
            }, []);

            const toCardifiedCard = () => {
                if (!checkitem.cardified_uid) {
                    return;
                }

                navigate(ROUTES.BOARD.CARD(projectUID, checkitem.cardified_uid!), { state: { isSamePage: true } });
            };

            return (
                <BoardCardCheckitemProvider
                    checkitem={checkitem}
                    isParent={isParent}
                    isValidating={isValidating}
                    setIsValidating={setIsValidating}
                    deleted={deleted}
                    update={forceUpdate}
                >
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
                                            title={t(`common.${isOpenedRef.current ? "Collapse" : "Expand"}`)}
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
                                        {checkitem.cardified_uid && (
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
                                            members={checkitem.assigned_members}
                                            isValidating={isValidating}
                                            setIsValidating={setIsValidating}
                                        />
                                    </Flex>
                                    <div className="block md:hidden">
                                        <SharedBoardCardCheckitemTimer />
                                    </div>
                                </Flex>
                                <Tooltip.Provider delayDuration={400}>
                                    <Tooltip.Root open={isTitleOpened} onOpenChange={setIsTitleOpened}>
                                        <Tooltip.Trigger asChild onClick={() => setIsTitleOpened(!isTitleOpened)}>
                                            <span className={cn("truncate", checkitem.cardified_uid && "sm:pl-2")}>{checkitem.title}</span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content className={sharedClassNames.popoverContent}>{checkitem.title}</Tooltip.Content>
                                    </Tooltip.Root>
                                </Tooltip.Provider>
                            </Flex>
                        </Flex>
                        <Flex items="center" gap="1.5">
                            <div className="hidden md:block">
                                <SharedBoardCardCheckitemTimer />
                            </div>
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
        }
    )
);

export default SharedBoardCardCheckitem;
