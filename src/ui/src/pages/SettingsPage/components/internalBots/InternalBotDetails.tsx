import { Breadcrumb, Flex } from "@/components/base";
import { InternalBotModel } from "@/core/models";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import InternalBotApiKey from "@/pages/SettingsPage/components/internalBots/InternalBotApiKey";
import InternalBotApiURL from "@/pages/SettingsPage/components/internalBots/InternalBotApiURL";
import InternalBotAvatar from "@/pages/SettingsPage/components/internalBots/InternalBotAvatar";
import InternalBotDefault from "@/pages/SettingsPage/components/internalBots/InternalBotDefault";
import InternalBotDisplayName from "@/pages/SettingsPage/components/internalBots/InternalBotDisplayName";
import InternalBotPlatform from "@/pages/SettingsPage/components/internalBots/InternalBotPlatform";
import InternalBotPlatformRunningType from "@/pages/SettingsPage/components/internalBots/InternalBotPlatformRunningType";
import InternalBotType from "@/pages/SettingsPage/components/internalBots/InternalBotType";
import InternalBotValue from "@/pages/SettingsPage/components/internalBots/InternalBotValue";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface IInternalBotDetailsProps {
    internalBot: InternalBotModel.TModel;
}

const InternalBotDetails = memo(({ internalBot }: IInternalBotDetailsProps) => {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { navigateRef, isValidating } = useAppSetting();
    const displayName = internalBot.useField("display_name");

    const moveToList = () => {
        if (isValidating) {
            return;
        }

        navigateRef.current(ROUTES.SETTINGS.INTERNAL_BOTS);
    };

    useEffect(() => {
        setPageAliasRef.current(t("settings.{botName} details", { botName: displayName }));
    }, [displayName]);

    return (
        <ModelRegistry.InternalBotModel.Provider model={internalBot}>
            <Breadcrumb.Root>
                <Breadcrumb.List>
                    <Breadcrumb.Item className="cursor-pointer">
                        <Breadcrumb.Link onClick={moveToList}>{t("settings.Internal bots")}</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>{t("settings.{botName} details", { botName: displayName })}</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>
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
