import { Breadcrumb, Flex } from "@/components/base";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { BotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import BotApiAuthType from "@/pages/SettingsPage/components/bots/BotApiAuthType";
import BotApiKey from "@/pages/SettingsPage/components/bots/BotApiKey";
import BotApiURL from "@/pages/SettingsPage/components/bots/BotApiURL";
import BotAppApiToken from "@/pages/SettingsPage/components/bots/BotAppApiToken";
import BotAvatar from "@/pages/SettingsPage/components/bots/BotAvatar";
import BotIpWhitelist from "@/pages/SettingsPage/components/bots/BotIpWhitelist";
import BotName from "@/pages/SettingsPage/components/bots/BotName";
import BotPrompt from "@/pages/SettingsPage/components/bots/BotPrompt";
import BotUniqueName from "@/pages/SettingsPage/components/bots/BotUniqueName";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface IBotDetailsProps {
    bot: BotModel.TModel;
}

const BotDetails = memo(({ bot }: IBotDetailsProps) => {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { isValidating } = useAppSetting();
    const name = bot.useField("name");

    const moveToList = () => {
        if (isValidating) {
            return;
        }

        navigate(ROUTES.SETTINGS.BOTS, { smooth: true });
    };

    useEffect(() => {
        setPageAliasRef.current(t("settings.{botName} details", { botName: name }));
    }, [name]);

    return (
        <ModelRegistry.BotModel.Provider model={bot}>
            <Breadcrumb.Root>
                <Breadcrumb.List>
                    <Breadcrumb.Item className="cursor-pointer">
                        <Breadcrumb.Link onClick={moveToList}>{t("settings.Bots")}</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>{t("settings.{botName} details", { botName: name })}</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>
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
            </Flex>
        </ModelRegistry.BotModel.Provider>
    );
});

export default BotDetails;
