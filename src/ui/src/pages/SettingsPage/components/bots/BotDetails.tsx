import { Breadcrumb, Flex } from "@/components/base";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";
import { BotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import BotApiKey from "@/pages/SettingsPage/components/bots/BotApiKey";
import BotApiURL from "@/pages/SettingsPage/components/bots/BotApiURL";
import BotAppApiToken from "@/pages/SettingsPage/components/bots/BotAppApiToken";
import BotAvatar from "@/pages/SettingsPage/components/bots/BotAvatar";
import BotIpWhitelist from "@/pages/SettingsPage/components/bots/BotIpWhitelist";
import BotName from "@/pages/SettingsPage/components/bots/BotName";
import BotPlatform from "@/pages/SettingsPage/components/bots/BotPlatform";
import BotPlatformRunningType from "@/pages/SettingsPage/components/bots/BotPlatformRunningType";
import BotUniqueName from "@/pages/SettingsPage/components/bots/BotUniqueName";
import BotValue from "@/pages/SettingsPage/components/bots/BotValue";
import { requirements } from "@/components/bots/BotValueInput/utils";
import { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ALLOWED_ALL_IPS_BY_PLATFORMS } from "@/core/models/bot.related.type";

export interface IBotDetailsProps {
    bot: BotModel.TModel;
}

const BotDetails = memo(({ bot }: IBotDetailsProps) => {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const navigate = usePageNavigateRef();
    const { isValidating } = useAppSetting();
    const name = bot.useField("name");
    const platform = bot.useField("platform");
    const runningType = bot.useField("platform_running_type");
    const formRequirements = useMemo(() => requirements[platform]?.[runningType] ?? [], [platform, runningType]);

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
                        <BotPlatform />
                        <BotPlatformRunningType />
                    </Flex>
                </Flex>
                <Flex justify="center" mt="3">
                    <Flex direction="col" gap="2" w="full" className="max-w-screen-xs">
                        {formRequirements.includes("url") && <BotApiURL />}
                        {formRequirements.includes("apiKey") && <BotApiKey />}
                        <BotAppApiToken />
                        {ALLOWED_ALL_IPS_BY_PLATFORMS[platform].includes(runningType) && <BotIpWhitelist />}
                    </Flex>
                </Flex>
                {formRequirements.includes("value") && (
                    <Flex justify="center" mt="3">
                        <Flex justify="center" w="full" className="max-w-screen-lg">
                            <BotValue />
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </ModelRegistry.BotModel.Provider>
    );
});

export default BotDetails;
