import { memo, useReducer, useRef } from "react";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetAllStarredProjects from "@/controllers/api/dashboard/useGetAllStarredProjects";
import { ROUTES } from "@/core/routing/constants";
import ProjectPage from "@/pages/DashboardPage/ProjectPage";
import CardsPage from "@/pages/DashboardPage/CardsPage";
import TrackingPage from "@/pages/DashboardPage/TrackingPage";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { Navigate } from "react-router-dom";
import { DashboardProvider } from "@/core/providers/DashboardProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { Project } from "@/core/models";

const DashboardProxy = memo((): JSX.Element => {
    const navigateRef = useRef(usePageNavigate());
    const [pageType, tabName] = location.pathname.split("/").slice(2);
    const { data, isFetching } = useGetAllStarredProjects();
    const scrollAreaUpdater = useReducer((x) => x + 1, 0);
    const [updatedStarredProjects, updateStarredProjects] = useReducer((x) => x + 1, 0);
    const [scrollAreaMutable] = scrollAreaUpdater;
    const { aboutMe, updated } = useAuth();
    const starredProjects = Project.Model.useModels((model) => model.starred, [data, isFetching, updated, updatedStarredProjects]);

    const headerNavs: Record<string, IHeaderNavItem> = {
        projects: {
            name: "dashboard.Projects",
            onClick: () => {
                navigateRef.current(ROUTES.DASHBOARD.PROJECTS.ALL);
            },
        },
        cards: {
            name: "dashboard.Cards",
            onClick: () => {
                navigateRef.current(ROUTES.DASHBOARD.CARDS);
            },
        },
        starred: {
            name: "dashboard.Starred",
            subNavs:
                starredProjects.map((project) => ({
                    name: project.title,
                    onClick: () => {
                        navigateRef.current(ROUTES.BOARD.MAIN(project.uid));
                    },
                })) ?? [],
        },
        tacking: {
            name: "dashboard.Tracking",
            onClick: () => {
                navigateRef.current(ROUTES.DASHBOARD.TRACKING);
            },
        },
    };

    const sidebarNavs: ISidebarNavItem[] = [
        {
            icon: "plus",
            name: "dashboard.Create New Project",
            onClick: () => {
                navigateRef.current(`${location.pathname}/new-project`);
            },
        },
        {
            icon: "history",
            name: "dashboard.My Activity",
            onClick: () => {
                navigateRef.current(`${location.pathname}/my-activity`);
            },
        },
    ];

    let pageContent;
    switch (pageType) {
        case "cards":
            pageContent = <CardsPage />;
            headerNavs.cards.active = true;
            break;
        case "tracking":
            pageContent = <TrackingPage />;
            headerNavs.tacking.active = true;
            break;
        case "projects":
            switch (tabName) {
                case "all":
                case "starred":
                case "recent":
                case "unstarred":
                    pageContent = (
                        <ProjectPage updateStarredProjects={updateStarredProjects} currentTab={tabName} scrollAreaUpdater={scrollAreaUpdater} />
                    );
                    break;
                default:
                    return <Navigate to={ROUTES.DASHBOARD.PROJECTS.ALL} />;
            }
            headerNavs.projects.active = true;
            break;
        default:
            return <Navigate to={ROUTES.DASHBOARD.PROJECTS.ALL} />;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={sidebarNavs} scrollAreaMutable={scrollAreaMutable}>
            <DashboardProvider navigate={navigateRef.current} currentUser={aboutMe()!}>
                {pageContent}
            </DashboardProvider>
        </DashboardStyledLayout>
    );
});

export default DashboardProxy;
