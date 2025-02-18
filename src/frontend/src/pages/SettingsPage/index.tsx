import { Toast } from "@/components/base";
import ComingSoon from "@/components/ComingSoon";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetAllSettings from "@/controllers/api/settings/useGetAllSettings";
import useIsSettingsAvailable from "@/controllers/api/settings/useIsSettingsAvailable";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { AppSettingProvider } from "@/core/providers/AppSettingProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { ROUTES } from "@/core/routing/constants";
import BotsPage from "@/pages/SettingsPage/BotsPage";
import GlobalRelationshipsPage from "@/pages/SettingsPage/GlobalRelationshipsPage";
import LangflowPage from "@/pages/SettingsPage/LangflowPage";
import WebhooksPage from "@/pages/SettingsPage/WebhookPage";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function SettingsProxy(): JSX.Element {
    const { setIsLoadingRef } = usePageHeader();
    const [t] = useTranslation();
    const { aboutMe } = useAuth();
    const navigateRef = useRef(usePageNavigate());
    const pathname = location.pathname.split("/").slice(0, 3).join("/");
    const { data, isFetching, error } = useIsSettingsAvailable();
    const { mutate: getAllSettingsMutate } = useGetAllSettings();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
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
                    setIsLoadingRef.current(false);
                    setIsReady(() => true);
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                            navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
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
                setIsLoadingRef.current(false);
            },
        },
        [ROUTES.SETTINGS.BOTS]: {
            icon: "bot",
            name: t("settings.Bots"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.BOTS);
                setIsLoadingRef.current(false);
            },
        },
        [ROUTES.SETTINGS.LANGFLOW]: {
            icon: "langflow-icon",
            name: t("settings.Langflow"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.LANGFLOW);
                setIsLoadingRef.current(false);
            },
        },
        [ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS]: {
            icon: "waypoints",
            name: t("settings.Global relationships"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS);
                setIsLoadingRef.current(false);
            },
        },
        [ROUTES.SETTINGS.WEBHOOKS]: {
            icon: "webhook",
            name: t("settings.Webhooks"),
            onClick: () => {
                navigateRef.current(ROUTES.SETTINGS.WEBHOOKS);
                setIsLoadingRef.current(false);
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
            pageContent = <ComingSoon />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.BOTS:
            pageContent = <BotsPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.SETTINGS.LANGFLOW:
            pageContent = <LangflowPage />;
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
            {isReady && aboutMe() ? (
                <AppSettingProvider currentUser={aboutMe()!} navigate={navigateRef}>
                    {pageContent}
                </AppSettingProvider>
            ) : (
                skeletonContent
            )}
        </DashboardStyledLayout>
    );
}

export default SettingsProxy;
