import { ROUTES } from "@/core/routing/constants";
import BotCreateFormDialog from "@/pages/SettingsPage/components/bots/BotCreateFormDialog";
import InternalBotCreateFormDialog from "@/pages/SettingsPage/components/internalBots/InternalBotCreateFormDialog";
import ApiKeyCreateFormDialog from "@/pages/SettingsPage/components/keys/ApiKeyCreateFormDialog";
import GlobalRelationshipCreateFormDialog from "@/pages/SettingsPage/components/relationships/GlobalRelationshipCreateFormDialog";
import UserCreateFormDialog from "@/pages/SettingsPage/components/users/UserCreateFormDialog";
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
            case ROUTES.SETTINGS.CREATE_USER:
                navigate(ROUTES.SETTINGS.USERS);
                break;
            case ROUTES.SETTINGS.CREATE_BOT:
                navigate(ROUTES.SETTINGS.BOTS);
                break;
            case ROUTES.SETTINGS.CREATE_INTERNAL_BOT:
                navigate(ROUTES.SETTINGS.INTERNAL_BOTS);
                break;
            case ROUTES.SETTINGS.CREATE_GLOBAL_RELATIONSHIP:
                navigate(ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS);
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
        case ROUTES.SETTINGS.CREATE_USER:
            modalContent = <UserCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_BOT:
            modalContent = <BotCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_INTERNAL_BOT:
            modalContent = <InternalBotCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
            break;
        case ROUTES.SETTINGS.CREATE_GLOBAL_RELATIONSHIP:
            modalContent = <GlobalRelationshipCreateFormDialog opened={isOpened} setOpened={changeIsOpenedState} />;
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
