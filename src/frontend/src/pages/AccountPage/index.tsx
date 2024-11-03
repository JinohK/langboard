import { useLocation, useNavigate } from "react-router-dom";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { RedirectToSignIn } from "@/core/helpers/AuthHelper";
import { useAuth } from "@/core/providers/AuthProvider";
import { ROUTES } from "@/core/routing/constants";
import EmailPage from "@/pages/AccountPage/EmailPage";
import PasswordPage from "@/pages/AccountPage/PasswordPage";
import ProfilePage from "@/pages/AccountPage/ProfilePage";

function AccountPage(): JSX.Element {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
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
        [ROUTES.ACCOUNT.EMAIL]: {
            icon: "mail",
            name: "user.Email",
            onClick: () => {
                navigate(ROUTES.ACCOUNT.EMAIL);
            },
        },
        [ROUTES.ACCOUNT.PASSWORD]: {
            icon: "shield-alert",
            name: "user.Password",
            onClick: () => {
                navigate(ROUTES.ACCOUNT.PASSWORD);
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
        case ROUTES.ACCOUNT.EMAIL:
            pageContent = <EmailPage />;
            break;
        case ROUTES.ACCOUNT.PASSWORD:
            pageContent = <PasswordPage />;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            {pageContent}
        </DashboardStyledLayout>
    );
}

export default AccountPage;
