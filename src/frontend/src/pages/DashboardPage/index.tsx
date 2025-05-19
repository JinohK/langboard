import { memo, useReducer, useRef } from "react";
import { IHeaderNavItem } from "@/components/Header/types";
import { DashboardStyledLayout } from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetAllStarredProjects from "@/controllers/api/dashboard/useGetAllStarredProjects";
import { ROUTES } from "@/core/routing/constants";
import ProjectPage from "@/pages/DashboardPage/ProjectPage";
import CardsPage, { SkeletonCardsPage } from "@/pages/DashboardPage/CardsPage";
import TrackingPage, { SkeletonTrackingPage } from "@/pages/DashboardPage/TrackingPage";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { DashboardProvider } from "@/core/providers/DashboardProvider";
import { useAuth } from "@/core/providers/AuthProvider";
import { Project } from "@/core/models";
import { useTranslation } from "react-i18next";
import { SkeletonProjecTabs } from "@/pages/DashboardPage/components/ProjectTabs";

const DashboardProxy = memo((): JSX.Element => {
    const [t] = useTranslation();
    const navigateRef = useRef(useNavigate());
    const [pageType, tabName] = location.pathname.split("/").slice(2);
    const { data, isFetching } = useGetAllStarredProjects();
    const scrollAreaUpdater = useReducer((x) => x + 1, 0);
    const [updatedStarredProjects, updateStarredProjects] = useReducer((x) => x + 1, 0);
    const [scrollAreaMutable] = scrollAreaUpdater;
    const { currentUser, updated } = useAuth();
    const starredProjects = Project.Model.useModels((model) => model.starred, [data, isFetching, updated, updatedStarredProjects]);

    const headerNavs: Record<string, IHeaderNavItem> = {
        projects: {
            name: t("dashboard.Projects"),
            onClick: () => {
                navigateRef.current(ROUTES.DASHBOARD.PROJECTS.ALL);
            },
        },
        cards: {
            name: t("dashboard.Cards"),
            onClick: () => {
                navigateRef.current(ROUTES.DASHBOARD.CARDS);
            },
        },
        starred: {
            name: t("dashboard.Starred"),
            subNavs:
                starredProjects.map((project) => ({
                    name: project.title,
                    onClick: () => {
                        navigateRef.current(ROUTES.BOARD.MAIN(project.uid));
                    },
                })) ?? [],
        },
        tacking: {
            name: t("dashboard.Tracking"),
            onClick: () => {
                navigateRef.current(ROUTES.DASHBOARD.TRACKING);
            },
        },
    };

    const sidebarNavs: ISidebarNavItem[] = [
        {
            icon: "plus",
            name: t("dashboard.Create New Project"),
            onClick: () => {
                navigateRef.current(`${location.pathname}/new-project`);
            },
        },
        {
            icon: "history",
            name: t("dashboard.My Activity"),
            onClick: () => {
                navigateRef.current(`${location.pathname}/my-activity`);
            },
        },
    ];

    let pageContent;
    let skeletonContent;
    switch (pageType) {
        case "cards":
            pageContent = <CardsPage />;
            skeletonContent = <SkeletonCardsPage />;
            headerNavs.cards.active = true;
            break;
        case "tracking":
            pageContent = <TrackingPage />;
            skeletonContent = <SkeletonTrackingPage />;
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
                    skeletonContent = <SkeletonProjecTabs />;
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
            {currentUser ? (
                <DashboardProvider navigate={navigateRef.current} currentUser={currentUser}>
                    {pageContent}
                </DashboardProvider>
            ) : (
                skeletonContent
            )}
        </DashboardStyledLayout>
    );
});

export default DashboardProxy;
