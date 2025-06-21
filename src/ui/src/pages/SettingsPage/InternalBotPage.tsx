import { Flex, Toast } from "@/components/base";
import { InternalBotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import InternalBotDetails from "@/pages/SettingsPage/components/internalBots/InternalBotDetails";
import InternalBotList from "@/pages/SettingsPage/components/internalBots/InternalBotList";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

function InternalBotPage() {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { navigateRef } = useAppSetting();
    const { botUID } = useParams();
    const [bot, setBot] = useState<InternalBotModel.TModel | null>(null);

    useEffect(() => {
        if (!botUID) {
            setPageAliasRef.current("Internal Bots");
            setBot(null);
            return;
        }

        const targetBot = InternalBotModel.Model.getModel(botUID);
        if (!targetBot) {
            Toast.Add.error(t("errors.requests.NF3004"));
            navigateRef.current(ROUTES.SETTINGS.INTERNAL_BOTS);
            return;
        }

        setPageAliasRef.current(`${targetBot.display_name} Details`);
        setBot(targetBot);
    }, [botUID]);

    return (
        <>
            {bot ? (
                <InternalBotDetails internalBot={bot} />
            ) : (
                <>
                    <Flex justify="between" mb="4" pb="2" textSize="3xl" weight="semibold" className="scroll-m-20 border-b tracking-tight">
                        <span className="max-w-72 truncate">{t("settings.Internal bots")}</span>
                    </Flex>
                    <InternalBotList />
                </>
            )}
        </>
    );
}

export default InternalBotPage;
