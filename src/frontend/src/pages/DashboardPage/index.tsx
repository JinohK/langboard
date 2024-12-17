import { memo, useReducer } from "react";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetAllStarredProjects from "@/controllers/api/dashboard/useGetAllStarredProjects";
import { ROUTES } from "@/core/routing/constants";
import ProjectPage from "@/pages/DashboardPage/ProjectPage";
import CardsPage from "@/pages/DashboardPage/CardsPage";
import TrackingPage from "@/pages/DashboardPage/TrackingPage";
import usePageNavigate from "@/core/hooks/usePageNavigate";

const DashboardPage = memo((): JSX.Element => {
    const navigate = usePageNavigate();
    const [pageType, tabName] = location.pathname.split("/").slice(2);
    const { data: allStarredProjects, refetch: refetchAllStarred } = useGetAllStarredProjects();
    const [scrollAreaMutable, updateScrollArea] = useReducer((x) => x + 1, 0);

    const headerNavs: Record<string, IHeaderNavItem> = {
        projects: {
            name: "dashboard.Projects",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.PROJECTS.ALL);
            },
        },
        cards: {
            name: "dashboard.Cards",
            onClick: () => {
                navigate(ROUTES.DASHBOARD.CARDS);
            },
        },
        starred: {
            name: "dashboard.Starred",
            subNavs:
                allStarredProjects?.projects.map((project) => ({
                    name: project.title,
                    onClick: () => {
                        navigate(ROUTES.BOARD.MAIN(project.uid));
                    },
                })) ?? [],
        },
        tacking: {
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
                navigate(`${location.pathname}/new-project`);
            },
        },
        {
            icon: "history",
            name: "dashboard.My Activity",
            onClick: () => {
                navigate(`${location.pathname}/my-activity`);
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
                    pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="all" updateScrollArea={updateScrollArea} />;
                    break;
                case "starred":
                    pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="starred" updateScrollArea={updateScrollArea} />;
                    break;
                case "recent":
                    pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="recent" updateScrollArea={updateScrollArea} />;
                    break;
                case "unstarred":
                    pageContent = <ProjectPage refetchAllStarred={refetchAllStarred} currentTab="unstarred" updateScrollArea={updateScrollArea} />;
                    break;
            }
            headerNavs.projects.active = true;
            break;
    }

    return (
        <DashboardStyledLayout headerNavs={Object.values(headerNavs)} sidebarNavs={sidebarNavs} scrollAreaMutable={scrollAreaMutable}>
            {pageContent}
        </DashboardStyledLayout>
    );
});

export default DashboardPage;
