import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetAllSettings from "@/controllers/api/settings/useGetAllSettings";
import useIsSettingsAvailable from "@/controllers/api/settings/useIsSettingsAvailable";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useNavigate } from "react-router-dom";
import { AppSettingProvider } from "@/core/providers/AppSettingProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import BotsPage from "@/pages/SettingsPage/BotsPage";
import GlobalRelationshipsPage from "@/pages/SettingsPage/GlobalRelationshipsPage";
import InternalBotsPage from "@/pages/SettingsPage/InternalBotsPage";
import WebhooksPage from "@/pages/SettingsPage/WebhooksPage";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/core/providers/SocketProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import UsersPage from "@/pages/SettingsPage/UsersPage";
import ApiKeysPage from "@/pages/SettingsPage/ApiKeysPage";

function SettingsProxy(): JSX.Element {
    const [t] = useTranslation();
    const { currentUser } = useAuth();
    const socket = useSocket();
    const navigateRef = useRef(useNavigate());
    const pathname = location.pathname.split("/").slice(0, 3).join("/");
    const { data, isFetching, error } = useIsSettingsAvailable();
    const { mutate: getAllSettingsMutate } = useGetAllSettings();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: {
                after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!data || isFetching) {
            setIsReady(() => false);
            return;
        }

        getAllSettingsMutate(
            {},
            {
                onSuccess: () => {
                    socket.subscribe(ESocketTopic.AppSettings, ["all"], () => {
                        setIsReady(() => true);
                    });
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: {
                            after: () => navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true }),
                        },
                    });

                    handle(error);
                },
            }
        );
    }, [isFetching]);

    const headerNavs: Record<string, IHeaderNavItem> = {};

    const sidebarNavs: Record<string, ISidebarNavItem> = {
        [ROUTES.SETTINGS.API_KEYS]: {
            icon: "key-round",
            name: t("settings.API keys"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.API_KEYS);
            },
        },
        [ROUTES.SETTINGS.USERS]: {
            icon: "users",
            name: t("settings.Users"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.USERS);
            },
        },
        [ROUTES.SETTINGS.BOTS]: {
            icon: "bot",
            name: t("settings.Bots"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.BOTS);
            },
        },
        [ROUTES.SETTINGS.INTERNAL_BOTS]: {
            icon: "langflow-icon",
            name: t("settings.Internal bots"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.INTERNAL_BOTS);
            },
        },
        [ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS]: {
            icon: "waypoints",
            name: t("settings.Global relationships"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS);
            },
        },
        [ROUTES.SETTINGS.WEBHOOKS]: {
            icon: "webhook",
            name: t("settings.Webhooks"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.WEBHOOKS);
            },
        },
    };

    if (sidebarNavs[pathname]) {
        sidebarNavs[pathname].current = true;
    }

    let pageContent;
    let skeletonContent;
    switch (pathname) {
        case ROUTES.SETTINGS.API_KEYS:
            pageContent = <ApiKeysPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.USERS:
            pageContent = <UsersPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.BOTS:
            pageContent = <BotsPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.INTERNAL_BOTS:
            pageContent = <InternalBotsPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS:
            pageContent = <GlobalRelationshipsPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.WEBHOOKS:
            pageContent = <WebhooksPage />;
            skeletonContent = <></>;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            {isReady && currentUser ? (
                <AppSettingProvider currentUser={currentUser} navigateRef={navigateRef}>
                    {pageContent}
                </AppSettingProvider>
            ) : (
                skeletonContent
            )}
        </DashboardStyledLayout>
    );
}

export default SettingsProxy;
