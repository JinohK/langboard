import { useLocation } from "react-router-dom";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { RedirectToSignIn } from "@/core/helpers/AuthHelper";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { AccountSettingProvider } from "@/core/providers/AccountSettingProvider";
import EmailPage, { SkeletonEmailPage } from "@/pages/AccountPage/EmailPage";
import PasswordPage from "@/pages/AccountPage/PasswordPage";
import ProfilePage from "@/pages/AccountPage/ProfilePage";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import GroupsPage, { SkeletonGroupsPage } from "@/pages/AccountPage/GroupsPage";
import PreferencesPage from "@/pages/AccountPage/PreferencesPage";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function AccountPage(): JSX.Element {
    const { setIsLoadingRef } = usePageHeader();
    const [t] = useTranslation();
    const { isAuthenticated, aboutMe, updated } = useAuth();
    const navigate = usePageNavigate();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(aboutMe());

    if (!isAuthenticated()) {
        return <RedirectToSignIn />;
    }

    useEffect(() => {
        setTimeout(() => {
            setIsLoadingRef.current(false);
        }, 0);
    }, [location]);

    useEffect(() => {
        setCurrentUser(aboutMe());
    }, [updated]);

    const headerNavs: Record<string, IHeaderNavItem> = {};

    const sidebarNavs: Record<string, ISidebarNavItem> = {
        [ROUTES.ACCOUNT.PROFILE]: {
            icon: "user-pen",
            name: t("myAccount.Profile"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PROFILE);
            },
        },
        [ROUTES.ACCOUNT.EMAILS.ROUTE]: {
            icon: "mail",
            name: t("myAccount.Emails"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.EMAILS.ROUTE);
            },
        },
        [ROUTES.ACCOUNT.PASSWORD]: {
            icon: "shield-alert",
            name: t("user.Password"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PASSWORD);
            },
        },
        [ROUTES.ACCOUNT.GROUPS]: {
            icon: "users",
            name: t("myAccount.Groups"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.GROUPS);
            },
        },
        [ROUTES.ACCOUNT.PREFERENCES]: {
            icon: "users",
            name: t("myAccount.Preferences"),
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PREFERENCES);
            },
        },
    };

    const pathname: string = location.pathname;

    sidebarNavs[pathname].current = true;

    let pageContent;
    let skeletonContent;
    switch (pathname) {
        case ROUTES.ACCOUNT.PROFILE:
            pageContent = <ProfilePage />;
            skeletonContent = <></>;
            break;
        case ROUTES.ACCOUNT.EMAILS.ROUTE:
            pageContent = <EmailPage />;
            skeletonContent = <SkeletonEmailPage />;
            break;
        case ROUTES.ACCOUNT.PASSWORD:
            pageContent = <PasswordPage />;
            skeletonContent = <></>;
            break;
        case ROUTES.ACCOUNT.GROUPS:
            pageContent = <GroupsPage />;
            skeletonContent = <SkeletonGroupsPage />;
            break;
        case ROUTES.ACCOUNT.PREFERENCES:
            pageContent = <PreferencesPage />;
            skeletonContent = <></>;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            {!currentUser ? skeletonContent : <AccountSettingProvider currentUser={currentUser}>{pageContent}</AccountSettingProvider>}
        </DashboardStyledLayout>
    );
}

export default AccountPage;
