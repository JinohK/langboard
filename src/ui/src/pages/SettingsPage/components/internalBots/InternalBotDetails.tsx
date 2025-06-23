import { Flex } from "@/components/base";
import { InternalBotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import InternalBotApiKey from "@/pages/SettingsPage/components/internalBots/InternalBotApiKey";
import InternalBotApiURL from "@/pages/SettingsPage/components/internalBots/InternalBotApiURL";
import InternalBotAvatar from "@/pages/SettingsPage/components/internalBots/InternalBotAvatar";
import InternalBotDefault from "@/pages/SettingsPage/components/internalBots/InternalBotDefault";
import InternalBotDisplayName from "@/pages/SettingsPage/components/internalBots/InternalBotDisplayName";
import InternalBotPlatform from "@/pages/SettingsPage/components/internalBots/InternalBotPlatform";
import InternalBotPlatformRunningType from "@/pages/SettingsPage/components/internalBots/InternalBotPlatformRunningType";
import InternalBotType from "@/pages/SettingsPage/components/internalBots/InternalBotType";
import InternalBotValue from "@/pages/SettingsPage/components/internalBots/InternalBotValue";
import { memo } from "react";

export interface IInternalBotDetailsProps {
    internalBot: InternalBotModel.TModel;
}

const InternalBotDetails = memo(({ internalBot }: IInternalBotDetailsProps) => {
    return (
        <ModelRegistry.InternalBotModel.Provider model={internalBot}>
            <Flex direction="col" gap="4">
                <InternalBotAvatar />
                <Flex justify="center">
                    <Flex direction="col" gap="2" w="full" className="max-w-screen-xs">
                        <InternalBotDisplayName />
                        <Flex gap="2" items="center">
                            <InternalBotType />
                            <InternalBotDefault />
                        </Flex>
                    </Flex>
                </Flex>
                <Flex justify="center" mt="3">
                    <Flex direction="col" gap="2" w="full" className="max-w-screen-xs">
                        <InternalBotPlatform />
                        <InternalBotPlatformRunningType />
                        <InternalBotApiURL />
                        <InternalBotApiKey />
                    </Flex>
                </Flex>
                <Flex justify="center" mt="3">
                    <Flex justify="center" w="full" className="max-w-screen-lg">
                        <InternalBotValue />
                    </Flex>
                </Flex>
            </Flex>
        </ModelRegistry.InternalBotModel.Provider>
    );
});

export default InternalBotDetails;
