import { Button, Flex, IconComponent } from "@/components/base";
import { useAppSetting } from "@/core/providers/AppSettingProvider";
import { ROUTES } from "@/core/routing/constants";
import BotList from "@/pages/SettingsPage/components/bots/BotList";
import { useTranslation } from "react-i18next";

function BotsPage() {
    const [t] = useTranslation();
    const { navigate, isValidating, setIsValidating } = useAppSetting();

    const openCreateDialog = () => {
        navigate.current(ROUTES.SETTINGS.CREATE_BOT);
    };

    return (
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
    );
}

export default BotsPage;
