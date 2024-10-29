import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { ROUTES } from "@/core/routing/constants";
import ChangePasswordPage from "@/pages/SettingPage/ChangePasswordPage";
import EditProfilePage from "@/pages/SettingPage/EditProfilePage";
import { useLocation, useNavigate } from "react-router-dom";

function SettingPage(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();

    const headerNavs: Record<string, IHeaderNavItem> = {};

    const sidebarNavs: Record<string, ISidebarNavItem> = {
        [ROUTES.SETTINGS.EDIT_PROFILE]: {
            icon: "user-pen",
            name: "myAccount.Edit profile",
            onClick: () => {
                navigate(ROUTES.SETTINGS.EDIT_PROFILE);
            },
        },
        [ROUTES.SETTINGS.CHANGE_PASSWORD]: {
            icon: "lock-keyhole",
            name: "myAccount.Change password",
            onClick: () => {
                navigate(ROUTES.SETTINGS.CHANGE_PASSWORD);
            },
        },
    };

    const pathname: string = location.pathname;

    sidebarNavs[pathname].current = true;

    let pageContent;
    switch (pathname) {
        case ROUTES.SETTINGS.EDIT_PROFILE:
            pageContent = <EditProfilePage />;
            break;
        case ROUTES.SETTINGS.CHANGE_PASSWORD:
            pageContent = <ChangePasswordPage />;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={Object.values(sidebarNavs)}>
            {pageContent}
        </DashboardStyledLayout>
    );
}

export default SettingPage;
