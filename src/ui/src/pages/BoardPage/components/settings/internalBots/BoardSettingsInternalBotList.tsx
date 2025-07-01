import { Flex } from "@/components/base";
import { InternalBotModel } from "@/core/models";
import BoardSettingsInternalBot from "@/pages/BoardPage/components/settings/internalBots/BoardSettingsInternalBot";
import { memo } from "react";

const BoardSettingsInternalBotList = memo(() => {
    return (
        <Flex direction="col" gap="2" py="4">
            {Object.values(InternalBotModel.EInternalBotType).map((botType) => {
                return <BoardSettingsInternalBot key={`board-settings-internal-bot-${botType}`} botType={botType} />;
            })}
        </Flex>
    );
});

export default BoardSettingsInternalBotList;
