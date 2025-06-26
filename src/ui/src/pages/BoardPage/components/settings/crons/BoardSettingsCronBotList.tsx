import { Flex } from "@/components/base";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { BotModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsCronBotScheduleListDialog from "@/pages/BoardPage/components/settings/crons/BoardSettingsCronBotScheduleListDialog";
import { memo } from "react";

const BoardSettingsCronBotList = memo(() => {
    const { project } = useBoardSettings();
    const projectBots = project.useForeignField("bots");

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

    return (
        <Flex items="center" justify="between" gap="3">
            <UserAvatar.Root
                userOrBot={bot}
                avatarSize="xs"
                withNameProps={{ className: "inline-flex gap-1 select-none", nameClassName: "text-base" }}
            >
                <UserAvatarDefaultList userOrBot={bot} projectUID={project.uid} />
            </UserAvatar.Root>

            <BoardSettingsCronBotScheduleListDialog bot={bot} />
        </Flex>
    );
});

export default BoardSettingsCronBotList;
