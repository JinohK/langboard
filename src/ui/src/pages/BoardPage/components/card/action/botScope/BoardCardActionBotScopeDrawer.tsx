import { Button, Dialog, Flex } from "@/components/base";
import BotLogList from "@/components/BotLogList";
import BotScheduleList from "@/components/BotScheduleList";
import BotTriggerConditionList from "@/components/BotTriggerConditionList";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { BotModel, ProjectCardBotScope } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { memo } from "react";
import { useTranslation } from "react-i18next";

interface IBoardColumnMoreMenuBotScopeItemProps {
    bot: BotModel.TModel;
}

const BoardCardActionBotScopeDrawer = memo(({ bot }: IBoardColumnMoreMenuBotScopeItemProps) => {
    const { projectUID, card } = useBoardCard();
    const botScopes = ProjectCardBotScope.Model.useModels((model) => model.bot_uid === bot.uid && model.card_uid === card.uid);
    const botScope = botScopes[0];

    return (
        <Flex items="center" justify="between" gap="3">
            <UserAvatar.Root
                userOrBot={bot}
                avatarSize="xs"
                withNameProps={{ className: "inline-flex gap-1 select-none", nameClassName: "text-base" }}
            >
                <UserAvatarDefaultList userOrBot={bot} projectUID={projectUID} />
            </UserAvatar.Root>

            <Flex items="center" gap="1">
                <BoardCardActionBotScopeDrawerDialog title="bot.Triggers">
                    <BotTriggerConditionList
                        params={{
                            target_table: "card",
                            target_uid: card.uid,
                            project_uid: projectUID,
                        }}
                        botUID={bot.uid}
                        botScope={botScope}
                    />
                </BoardCardActionBotScopeDrawerDialog>
                <BoardCardActionBotScopeDrawerDialog title="bot.Schedules">
                    <BotScheduleList
                        bot={bot}
                        params={{
                            target_table: "card",
                            project_uid: projectUID,
                        }}
                        target={card}
                    />
                </BoardCardActionBotScopeDrawerDialog>
                <BoardCardActionBotScopeDrawerDialog title="bot.Logs">
                    <BotLogList
                        bot={bot}
                        params={{
                            target_table: "card",
                            project_uid: projectUID,
                        }}
                        target={card}
                    />
                </BoardCardActionBotScopeDrawerDialog>
            </Flex>
        </Flex>
    );
});

function BoardCardActionBotScopeDrawerDialog({ title, children }: { title: string; children: React.ReactNode }) {
    const [t] = useTranslation();

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <Button size="sm">{t(title)}</Button>
            </Dialog.Trigger>
            <Dialog.Content className="p-2 pt-8 sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg" aria-describedby="">
                <Dialog.Title hidden />
                {children}
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default BoardCardActionBotScopeDrawer;
