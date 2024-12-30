import { useLocation } from "react-router-dom";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { RedirectToSignIn } from "@/core/helpers/AuthHelper";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import EmailPage from "@/pages/AccountPage/EmailPage";
import PasswordPage from "@/pages/AccountPage/PasswordPage";
import ProfilePage from "@/pages/AccountPage/ProfilePage";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import GroupsPage from "@/pages/AccountPage/GroupsPage";

function AccountPage(): JSX.Element {
    const { isAuthenticated } = useAuth();
    const navigate = usePageNavigate();
    const location = useLocation();

    if (!isAuthenticated()) {
        return <RedirectToSignIn />;
    }

    const headerNavs: Record<string, IHeaderNavItem> = {};

    const sidebarNavs: Record<string, ISidebarNavItem> = {
        [ROUTES.ACCOUNT.PROFILE]: {
            icon: "user-pen",
            name: "myAccount.Profile",
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PROFILE);
            },
        },
        [ROUTES.ACCOUNT.EMAILS.ROUTE]: {
            icon: "mail",
            name: "myAccount.Emails",
            onClick: () => {
                navigate(ROUTES.ACCOUNT.EMAILS.ROUTE);
            },
        },
        [ROUTES.ACCOUNT.PASSWORD]: {
            icon: "shield-alert",
            name: "user.Password",
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PASSWORD);
            },
        },
        [ROUTES.ACCOUNT.GROUPS]: {
            icon: "users",
            name: "myAccount.Groups",
            onClick: () => {
                navigate(ROUTES.ACCOUNT.GROUPS);
            },
        },
    };

    const pathname: string = location.pathname;

    sidebarNavs[pathname].current = true;

    let pageContent;
    switch (pathname) {
        case ROUTES.ACCOUNT.PROFILE:
            pageContent = <ProfilePage />;
            break;
        case ROUTES.ACCOUNT.EMAILS.ROUTE:
            pageContent = <EmailPage />;
            break;
        case ROUTES.ACCOUNT.PASSWORD:
            pageContent = <PasswordPage />;
            break;
        case ROUTES.ACCOUNT.GROUPS:
            pageContent = <GroupsPage />;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            {pageContent}
        </DashboardStyledLayout>
    );
}

export default AccountPage;
