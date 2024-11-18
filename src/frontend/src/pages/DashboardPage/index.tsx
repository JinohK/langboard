import { useReducer, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetAllStarredProjects from "@/controllers/dashboard/useGetAllStarredProjects";
import { ROUTES } from "@/core/routing/constants";
import ProjectPage from "@/pages/DashboardPage/ProjectPage";
import CardsPage from "@/pages/DashboardPage/CardsPage";
import TrackingPage from "@/pages/DashboardPage/TrackingPage";
import CreateProjectFormDialog from "@/pages/DashboardPage/components/CreateProjectFormDialog";
import MyActivityDialog from "@/pages/DashboardPage/components/MyActivityDialog";

function DashboardPage(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const [projectFormOpened, setProjectFormOpened] = useState(location.pathname.endsWith("/newproject"));
    const [activityOpened, setActivityOpened] = useState(location.pathname.endsWith("/myactivity"));
    const { data: allStarredProjects, refetch: refetchAllStarred } = useGetAllStarredProjects();
    const [scrollAreaMutable, updateScrollArea] = useReducer((x) => x + 1, 0);

    const headerNavs: Record<string, IHeaderNavItem> = {
        [ROUTES.DASHBOARD.ROUTE]: {
            name: "dashboard.Projects",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
            },
        },
        [ROUTES.DASHBOARD.CARDS]: {
            name: "dashboard.Cards",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.CARDS);
            },
        },
        starred: {
            name: "dashboard.Starred",
            subNavs:
                allStarredProjects?.projects.map((project) => {
                    return {
                        name: project.title,
                        onClick: () => {
                            navigate(ROUTES.BOARD.MAIN(project.uid));
                        },
                    };
                }) ?? [],
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
            onClick: () => {
                navigate(`${location.pathname}/newproject`);
                setProjectFormOpened(true);
            },
        },
        {
            icon: "history",
            name: "dashboard.My Activity",
            onClick: () => {
                navigate(`${location.pathname}/myactivity`);
                setActivityOpened(true);
            },
        },
    ];

    const pathname: string = location.pathname.replace(/\/newproject$/, "").replace(/\/myactivity$/, "");

    if (pathname.startsWith(ROUTES.DASHBOARD.PROJECTS.ROUTE)) {
        headerNavs[ROUTES.DASHBOARD.ROUTE].active = true;
    } else {
        headerNavs[pathname].active = true;
    }

    let pageContent;
    switch (pathname) {
        case ROUTES.DASHBOARD.CARDS:
            pageContent = <CardsPage />;
            break;
        case ROUTES.DASHBOARD.TRACKING:
            pageContent = <TrackingPage />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.ALL:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="all" updateScrollArea={updateScrollArea} />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.STARRED:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="starred" updateScrollArea={updateScrollArea} />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.RECENT:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="recent" updateScrollArea={updateScrollArea} />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.UNSTARRED:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="unstarred" updateScrollArea={updateScrollArea} />;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={sidebarNavs} scrollAreaMutable={scrollAreaMutable}>
            {pageContent}
            <CreateProjectFormDialog
                opened={projectFormOpened}
                setOpened={(opened: bool) => {
                    if (!opened) {
                        navigate(location.pathname.replace(/\/newproject$/, ""));
                    }
                    setProjectFormOpened(opened);
                }}
            />
            <MyActivityDialog
                opened={activityOpened}
                setOpened={(opened: bool) => {
                    if (!opened) {
                        navigate(location.pathname.replace(/\/myactivity$/, ""));
                    }
                    setActivityOpened(opened);
                }}
            />
        </DashboardStyledLayout>
    );
}

export default DashboardPage;
