import { Flex } from "@/components/base";
import { BotModel } from "@/core/models";
import Bot from "@/pages/SettingsPage/components/bots/Bot";

function BotList() {
    const bots = BotModel.Model.useModels(() => true);

    return (
        <Flex direction="col" gap="3">
            {bots.map((bot) => (
                <Bot key={bot.uid} bot={bot} />
            ))}
        </Flex>
    );
}

export default BotList;
