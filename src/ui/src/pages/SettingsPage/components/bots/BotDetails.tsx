import { Flex } from "@/components/base";
import { BotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import BotApiAuthType from "@/pages/SettingsPage/components/bots/BotApiAuthType";
import BotApiKey from "@/pages/SettingsPage/components/bots/BotApiKey";
import BotApiURL from "@/pages/SettingsPage/components/bots/BotApiURL";
import BotAppApiToken from "@/pages/SettingsPage/components/bots/BotAppApiToken";
import BotAvatar from "@/pages/SettingsPage/components/bots/BotAvatar";
import BotIpWhitelist from "@/pages/SettingsPage/components/bots/BotIpWhitelist";
import BotName from "@/pages/SettingsPage/components/bots/BotName";
import BotPrompt from "@/pages/SettingsPage/components/bots/BotPrompt";
import BotTriggerConditionList from "@/pages/SettingsPage/components/bots/BotTriggerConditionList";
import BotUniqueName from "@/pages/SettingsPage/components/bots/BotUniqueName";
import { memo } from "react";

export interface IBotDetailsProps {
    bot: BotModel.TModel;
}

const BotDetails = memo(({ bot }: IBotDetailsProps) => {
    return (
        <ModelRegistry.BotModel.Provider model={bot}>
            <Flex direction="col" gap="4">
                <BotAvatar />
                <Flex justify="center">
                    <Flex direction="col" gap="2" w="full" className="max-w-screen-xs">
                        <BotName />
                        <BotUniqueName />
                    </Flex>
                </Flex>
                <Flex justify="center" mt="3">
                    <Flex direction="col" gap="2" w="full" className="max-w-screen-xs">
                        <BotApiURL />
                        <BotApiAuthType />
                        <BotApiKey />
                        <BotAppApiToken />
                        <BotIpWhitelist />
                        <BotPrompt />
                    </Flex>
                </Flex>
                <Flex justify="center" mt="3">
                    <Flex justify="center" w="full" className="max-w-screen-md">
                        <BotTriggerConditionList />
                    </Flex>
                </Flex>
            </Flex>
        </ModelRegistry.BotModel.Provider>
    );
});

export default BotDetails;
