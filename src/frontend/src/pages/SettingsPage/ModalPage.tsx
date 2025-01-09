import { ROUTES } from "@/core/routing/constants";
import BotCreateFormDialog from "@/pages/SettingsPage/components/bots/BotCreateFormDialog";
import ApiKeyCreateFormDialog from "@/pages/SettingsPage/components/keys/ApiKeyCreateFormDialog";
import WebhookCreateFormDialog from "@/pages/SettingsPage/components/webhook/WebhookCreateFormDialog";
import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ModalPage = memo(() => {
    const navigate = useNavigate();
    const [isOpened, setIsOpened] = useState(true);

    const moveToBack = () => {
        switch (pathname) {
            case ROUTES.SETTINGS.CREATE_API_KEY:
                navigate(ROUTES.SETTINGS.API_KEYS);
                break;
            case ROUTES.SETTINGS.CREATE_BOT:
                navigate(ROUTES.SETTINGS.BOTS);
                break;
            case ROUTES.SETTINGS.CREATE_WEBHOOK:
                navigate(ROUTES.SETTINGS.WEBHOOKS);
                break;
            default:
                navigate(ROUTES.SETTINGS.ROUTE);
                break;
        }
    };

    const changeIsOpenedState = (opened: bool) => {
        if (!opened) {
            moveToBack();
        }
        setIsOpened(opened);
    };

    const pathname = location.pathname;

    let modalContent;
    switch (pathname) {
        case ROUTES.SETTINGS.CREATE_API_KEY:
            modalContent = <ApiKeyCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_BOT:
            modalContent = <BotCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_WEBHOOK:
            modalContent = <WebhookCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        default:
            modalContent = null;
            break;
    }

    return modalContent;
});

export default ModalPage;
