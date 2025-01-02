import { memo, useEffect, useReducer, useRef } from "react";
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
import { useSocket } from "@/core/providers/SocketProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { Project } from "@/core/models";

const DashboardProxy = memo((): JSX.Element => {
    const navigate = useRef(usePageNavigate());
    const socket = useSocket();
    const [pageType, tabName] = location.pathname.split("/").slice(2);
    const { data, isFetching } = useGetAllStarredProjects();
    const scrollAreaUpdater = useReducer((x) => x + 1, 0);
    const [updatedStarredProjects, updateStarredProjects] = useReducer((x) => x + 1, 0);
    const [scrollAreaMutable] = scrollAreaUpdater;
    const { aboutMe, updated } = useAuth();
    const starredProjects = Project.Model.useModels((model) => model.starred, [data, isFetching, updated, updatedStarredProjects]);

    useEffect(() => {
        const user = aboutMe();
        if (!data || isFetching || !user) {
            return;
        }

        socket.subscribe(ESocketTopic.Dashboard, user.uid);

        for (let i = 0; i < starredProjects.length; ++i) {
            const project = starredProjects[i];
            project.subscribeDashboardSocketHandlers(user.uid);
        }

        return () => {
            socket.unsubscribe(ESocketTopic.Dashboard, user.uid);
        };
    }, [starredProjects]);

    const headerNavs: Record<string, IHeaderNavItem> = {
        projects: {
            name: "dashboard.Projects",
            onClick: () => {
                navigate.current(ROUTES.DASHBOARD.PROJECTS.ALL);
            },
        },
        cards: {
            name: "dashboard.Cards",
            onClick: () => {
                navigate.current(ROUTES.DASHBOARD.CARDS);
            },
        },
        starred: {
            name: "dashboard.Starred",
            subNavs:
                starredProjects.map((project) => ({
                    name: project.title,
                    onClick: () => {
                        navigate.current(ROUTES.BOARD.MAIN(project.uid));
                    },
                })) ?? [],
        },
        tacking: {
            name: "dashboard.Tracking",
            onClick: () => {
                navigate.current(ROUTES.DASHBOARD.TRACKING);
            },
        },
    };

    const sidebarNavs: ISidebarNavItem[] = [
        {
            icon: "plus",
            name: "dashboard.Create New Project",
            onClick: () => {
                navigate.current(`${location.pathname}/new-project`);
            },
        },
        {
            icon: "history",
            name: "dashboard.My Activity",
            onClick: () => {
                navigate.current(`${location.pathname}/my-activity`);
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
            <DashboardProvider navigate={navigate.current} currentUser={aboutMe()!}>
                {pageContent}
            </DashboardProvider>
        </DashboardStyledLayout>
    );
});

export default DashboardProxy;
