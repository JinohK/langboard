import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import { ROUTES } from "@/core/routing/constants";
import { useLocation, useNavigate } from "react-router-dom";
import ProjectPage from "@/pages/DashboardPage/ProjectPage";
import TasksPage from "@/pages/DashboardPage/TasksPage";
import TrackingPage from "@/pages/DashboardPage/TrackingPage";
import CreateProjectFormDialog from "@/pages/DashboardPage/components/CreateProjectFormDialog";
import { useState } from "react";
import useGetAllStarredProjects from "@/controllers/dashboard/useGetAllStarredProjects";

function DashboardPage(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const [projectFormopened, setProjectFormOpened] = useState(false);
    const { data: allStarredProjects, refetch: refetchAllStarred } = useGetAllStarredProjects();

    const headerNavs: Record<string, IHeaderNavItem> = {
        [ROUTES.DASHBOARD.ROUTE]: {
            name: "dashboard.Projects",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
            },
        },
        [ROUTES.DASHBOARD.TASKS]: {
            name: "dashboard.Tasks",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.TASKS);
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
                setProjectFormOpened(true);
            },
        },
        {
            icon: "history",
            name: "dashboard.My Activity",
            onClick: () => {
                // TODO: Activity, Implementing navigation to activity
            },
        },
    ];

    const pathname: string = location.pathname;

    if (pathname.startsWith(ROUTES.DASHBOARD.PROJECTS.ROUTE)) {
        headerNavs[ROUTES.DASHBOARD.ROUTE].active = true;
    } else {
        headerNavs[pathname].active = true;
    }

    let pageContent;
    switch (pathname) {
        case ROUTES.DASHBOARD.TASKS:
            pageContent = <TasksPage />;
            break;
        case ROUTES.DASHBOARD.TRACKING:
            pageContent = <TrackingPage />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.ALL:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="all" />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.STARRED:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="starred" />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.RECENT:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="recent" />;
            break;
        case ROUTES.DASHBOARD.PROJECTS.UNSTARRED:
            pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="unstarred" />;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={sidebarNavs}>
            {pageContent}
            <CreateProjectFormDialog opened={projectFormopened} setOpened={setProjectFormOpened} />
        </DashboardStyledLayout>
    );
}

export default DashboardPage;
