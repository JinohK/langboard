import { Flex } from "@/components/base";
import { BotModel } from "@/core/models";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import BotApiAuthType from "@/pages/SettingsPage/components/bots/BotApiAuthType";
import BotApiKey from "@/pages/SettingsPage/components/bots/BotApiKey";
import BotApiURL from "@/pages/SettingsPage/components/bots/BotApiURL";
import BotAppApiToken from "@/pages/SettingsPage/components/bots/BotAppApiToken";
import BotAvatar from "@/pages/SettingsPage/components/bots/BotAvatar";
import BotIpWhitelist from "@/pages/SettingsPage/components/bots/BotIpWhitelist";
import BotName from "@/pages/SettingsPage/components/bots/BotName";
import BotTriggerConditionList from "@/pages/SettingsPage/components/bots/BotTriggerConditionList";
import BotUniqueName from "@/pages/SettingsPage/components/bots/BotUniqueName";
import { memo, useEffect } from "react";

export interface IBotDetailsProps {
    bot: BotModel.TModel;
}

const BotDetails = memo(({ bot }: IBotDetailsProps) => {
    const { setIsLoadingRef } = usePageLoader();

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, [bot]);

    return (
        <Flex direction="col" gap="4">
            <BotAvatar bot={bot} />
            <Flex justify="center">
                <Flex direction="col" gap="2" w="full" className="max-w-screen-xs">
                    <BotName bot={bot} />
                    <BotUniqueName bot={bot} />
                </Flex>
            </Flex>
            <Flex justify="center" mt="3">
                <Flex direction="col" gap="2" w="full" className="max-w-screen-xs">
                    <BotApiURL bot={bot} />
                    <BotApiAuthType bot={bot} />
                    <BotApiKey bot={bot} />
                    <BotAppApiToken bot={bot} />
                    <BotIpWhitelist bot={bot} />
                </Flex>
            </Flex>
            <Flex justify="center" mt="3">
                <Flex justify="center" w="full" className="max-w-screen-md">
                    <BotTriggerConditionList bot={bot} />
                </Flex>
            </Flex>
        </Flex>
    );
});

export default BotDetails;
