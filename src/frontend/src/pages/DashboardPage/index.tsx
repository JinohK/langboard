import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { ROUTES } from "@/core/routing/constants";
import { useLocation, useNavigate } from "react-router-dom";
import ProjectPage from "@/pages/DashboardPage/ProjectPage";
import OutlinesPage from "@/pages/DashboardPage/OutlinesPage";
import TrackingPage from "@/pages/DashboardPage/TrackingPage";

function DashboardPage(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const headerNavs: Record<string, IHeaderNavItem> = {
        [ROUTES.DASHBOARD.MAIN]: {
            name: "dashboard.Projects",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.MAIN);
            },
        },
        [ROUTES.DASHBOARD.OUTLINES]: {
            name: "dashboard.Outlines",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.OUTLINES);
            },
        },
        starred: {
            name: "dashboard.Starred",
            subNavs: [],
        },
        [ROUTES.DASHBOARD.TRACKING]: {
            name: "dashboard.Tracking",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.TRACKING);
            },
        },
    };

    const sidebarNavs: ISidebarNavItem[] = [
        {
            icon: "plus",
            name: "dashboard.Create New Project",
        },
    ];

    let pathname: string = location.pathname;
    if (!headerNavs[pathname]) {
        pathname = ROUTES.DASHBOARD.MAIN;
    }

    headerNavs[pathname].active = true;

    let pageContent;
    switch (pathname) {
        case ROUTES.DASHBOARD.OUTLINES:
            pageContent = <OutlinesPage />;
            break;
        case ROUTES.DASHBOARD.TRACKING:
            pageContent = <TrackingPage />;
            break;
        case ROUTES.DASHBOARD.MAIN:
        default:
            pageContent = <ProjectPage />;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={sidebarNavs}>
            {pageContent}
        </DashboardStyledLayout>
    );
}

export default DashboardPage;
