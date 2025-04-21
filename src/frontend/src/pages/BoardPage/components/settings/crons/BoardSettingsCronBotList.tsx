import { Flex } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { BotModel, User } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsCronBotScheduleListDialog from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleListDialog";
import { memo } from "react";

const BoardSettingsCronBotList = memo(() => {
    const { project } = useBoardSettings();
    const projectBots = project.useForeignField<BotModel.TModel>("bots");

    return (
        <Flex direction="col" gap="2" py="4">
            {projectBots.map((bot) => (
                <BoardSettingsCronBot key={bot.uid} bot={bot} />
            ))}
        </Flex>
    );
});

interface IBoardSettingsCronBotProps {
    bot: BotModel.TModel;
}

const BoardSettingsCronBot = memo(({ bot }: IBoardSettingsCronBotProps) => {
    const { project } = useBoardSettings();
    const botAsUser = bot.useForeignField<User.TModel>("as_user")[0];

    return (
        <Flex items="center" justify="between" gap="3">
            <UserAvatar.Root user={botAsUser} avatarSize="xs" withName labelClassName="inline-flex gap-1 select-none" nameClassName="text-base">
                <UserAvatarDefaultList user={botAsUser} projectUID={project.uid} />
            </UserAvatar.Root>

            <BoardSettingsCronBotScheduleListDialog bot={bot} />
        </Flex>
    );
});

export default BoardSettingsCronBotList;
