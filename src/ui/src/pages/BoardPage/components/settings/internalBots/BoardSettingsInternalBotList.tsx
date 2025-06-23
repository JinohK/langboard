import { Flex } from "@/components/base";
import { InternalBotModel } from "@/core/models";
import { useBoardSettings } from "@/core/providers/BoardSettingsProvider";
import BoardSettingsInternalBot from "@/pages/BoardPage/components/settings/internalBots/BoardSettingsInternalBot";
import { memo } from "react";

const BoardSettingsInternalBotList = memo(() => {
    const { project } = useBoardSettings();
    const internalBots = project.useForeignField<InternalBotModel.TModel>("internal_bots");

    return (
        <>
            <Flex direction="col" gap="2" py="4">
                {Object.values(InternalBotModel.EInternalBotType).map((botType) => {
                    const bot = internalBots.find((model) => model.bot_type === botType);
                    if (!bot) {
                        return null;
                    }

                    return <BoardSettingsInternalBot key={`board-settings-internal-bot-${bot.uid}`} internalBot={bot} />;
                })}
            </Flex>
        </>
    );
});

export default BoardSettingsInternalBotList;
