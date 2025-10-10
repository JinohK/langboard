import { Box, DropdownMenu, Flex, IconComponent, Tooltip } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import useBoardUIBotScopeConditionsUpdatedHandlers from "@/controllers/socket/board/botScopes/useBoardUIBotScopeTriggerConditionsUpdatedHandlers";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { BaseBotScheduleModel, BotModel, ProjectColumn, ProjectColumnBotSchedule, ProjectColumnBotScope } from "@/core/models";
import { useBoard } from "@/core/providers/BoardProvider";
import { memo, useMemo, useReducer } from "react";
import { useTranslation } from "react-i18next";

const BoardColumnMoreMenuBotList = memo(({ column }: { column: ProjectColumn.TModel }) => {
    const bots = BotModel.Model.useModels(() => true);

    if (!bots.length) {
        return null;
    }

    return (
        <>
            <DropdownMenu.Separator />
            <Box className="max-h-[200px] overflow-y-auto">
                {bots.map((bot) => (
                    <BoardColumnMoreMenuBotListItem key={bot.uid} bot={bot} column={column} />
                ))}
            </Box>
        </>
    );
});
BoardColumnMoreMenuBotList.displayName = "Board.ColumnMoreMenuBotList";

interface IBoardColumnMoreMenuBotListItemProps {
    bot: BotModel.TModel;
    column: ProjectColumn.TModel;
}

const BoardColumnMoreMenuBotListItem = memo(({ bot, column }: IBoardColumnMoreMenuBotListItemProps) => {
    const { project, socket } = useBoard();
    const [updated, forceUpdate] = useReducer((x) => x + 1, 0);
    const botScopes = ProjectColumnBotScope.Model.useModels(
        (model) => model.bot_uid === bot.uid && model.project_column_uid === column.uid && model.conditions.length > 0,
        [updated]
    );
    const botSchedules = ProjectColumnBotSchedule.Model.useModels(
        (model) => model.bot_uid === bot.uid && model.project_column_uid === column.uid && model.status !== BaseBotScheduleModel.EStatus.Stopped
    );
    const botScope = botScopes[0];
    const botSchedule = botSchedules[0];
    const handlers = useMemo(
        () =>
            useBoardUIBotScopeConditionsUpdatedHandlers({
                projectUID: project.uid,
                callback: () => {
                    forceUpdate();
                },
            }),
        [forceUpdate]
    );
    useSwitchSocketHandlers({ socket, handlers, dependencies: [handlers] });

    if (!botScope && !botSchedule) {
        return null;
    }

    return (
        <DropdownMenu.Item
            className="cursor-default justify-between px-1 [&>span]:flex [&>span]:w-full [&>span]:items-center"
            onClick={(e) => e.preventDefault()}
        >
            <UserAvatar.Root
                userOrBot={bot}
                avatarSize="xs"
                className="size-5 !cursor-default"
                withNameProps={{
                    className: "inline-flex gap-1 select-none",
                    nameClassName: "text-sm max-w-[calc(theme(spacing.14)_+_theme(spacing.1))] truncate",
                }}
            >
                <UserAvatarDefaultList
                    userOrBot={bot}
                    scope={{
                        projectUID: project.uid,
                        columnUID: column.uid,
                    }}
                />
            </UserAvatar.Root>

            <Flex items="end" gap="1">
                {botScope && <BoardColumnMoreMenuBotListItemScopeIcon botScope={botScope} />}
                {<BoardColumnMoreMenuBotListItemScheduleIcon botSchedule={botSchedule} />}
            </Flex>
        </DropdownMenu.Item>
    );
});

interface IBoardColumnMoreMenuBotListItemScopeIconProps {
    botScope: ProjectColumnBotScope.TModel;
}

const BoardColumnMoreMenuBotListItemScopeIcon = ({ botScope }: IBoardColumnMoreMenuBotListItemScopeIconProps) => {
    const [t] = useTranslation();
    const conditions = botScope.useField("conditions");

    if (!conditions.length) {
        return null;
    }

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <IconComponent icon="view" size="4" />
            </Tooltip.Trigger>
            <Tooltip.Content>{t("bot.Scoped")}</Tooltip.Content>
        </Tooltip.Root>
    );
};

interface IBoardColumnMoreMenuBotListItemScheduleIconProps {
    botSchedule?: ProjectColumnBotSchedule.TModel;
}

const BoardColumnMoreMenuBotListItemScheduleIcon = ({ botSchedule }: IBoardColumnMoreMenuBotListItemScheduleIconProps) => {
    const [t] = useTranslation();

    if (!botSchedule) {
        return null;
    }

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <IconComponent icon="clipboard-clock" size="4" />
            </Tooltip.Trigger>
            <Tooltip.Content>{t("bot.Scheduled")}</Tooltip.Content>
        </Tooltip.Root>
    );
};

export default BoardColumnMoreMenuBotList;
