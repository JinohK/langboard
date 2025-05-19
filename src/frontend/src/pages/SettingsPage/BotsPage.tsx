import { Button, Flex, IconComponent, Toast } from "@/components/base";
import { BotModel } from "@/core/models";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import BotDetails from "@/pages/SettingsPage/components/bots/BotDetails";
import BotList from "@/pages/SettingsPage/components/bots/BotList";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

function BotsPage() {
    const { setPageAliasRef } = usePageHeader();
    const [t] = useTranslation();
    const { navigateRef, isValidating } = useAppSetting();
    const { botUID } = useParams();
    const [bot, setBot] = useState<BotModel.TModel | null>(null);

    useEffect(() => {
        if (!botUID) {
            setPageAliasRef.current("Bots");
            setBot(null);
            return;
        }

        const bot = BotModel.Model.getModel(botUID);
        if (!bot) {
            Toast.Add.error(t("settings.errors.Bot not found."));
            navigateRef.current(ROUTES.SETTINGS.BOTS);
            return;
        }

        setPageAliasRef.current(`${bot.name} Details`);
        setBot(bot);
    }, [botUID]);

    const openCreateDialog = () => {
        navigateRef.current(ROUTES.SETTINGS.CREATE_BOT);
    };

    return (
        <>
            {bot ? (
                <BotDetails bot={bot} />
            ) : (
                <>
                    <Flex justify="between" mb="4" pb="2" textSize="3xl" weight="semibold" className="scroll-m-20 border-b tracking-tight">
                        <span className="w-36">{t("settings.Bots")}</span>
                        <Button variant="outline" disabled={isValidating} className="gap-2 pl-2 pr-3" onClick={openCreateDialog}>
                            <IconComponent icon="plus" size="4" />
                            {t("settings.Add new")}
                        </Button>
                    </Flex>
                    <BotList />
                </>
            )}
        </>
    );
}

export default BotsPage;
