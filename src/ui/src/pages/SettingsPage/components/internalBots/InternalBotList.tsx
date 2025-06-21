import { Flex } from "@/components/base";
import { InternalBotModel } from "@/core/models";
import InternalBot from "@/pages/SettingsPage/components/internalBots/InternalBot";

function InternalBotList() {
    const internalBots = InternalBotModel.Model.useModels(() => true);

    return (
        <Flex direction="col" gap="3">
            {internalBots.map((internalBot) => (
                <InternalBot key={internalBot.uid} data-id={internalBot.uid} internalBot={internalBot} />
            ))}
        </Flex>
    );
}

export default InternalBotList;
