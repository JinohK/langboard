import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useGetProjects, { IGetProjectsResponse } from "@/controllers/api/dashboard/useGetProjects";
import { ROUTES } from "@/core/routing/constants";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { useDashboard } from "@/core/providers/DashboardProvider";
import { useSocket } from "@/core/providers/SocketProvider";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { PROJECT_TABS } from "@/pages/DashboardPage/constants";
import ProjectTabs, { SkeletonProjecTabs } from "@/pages/DashboardPage/components/ProjectTabs";

interface IProjectPageProps {
    currentTab: keyof IGetProjectsResponse;
    refetchAllStarred: () => Promise<unknown>;
    scrollAreaUpdater: [number, React.DispatchWithoutAction];
}

const ProjectPage = memo(({ currentTab, refetchAllStarred, scrollAreaUpdater }: IProjectPageProps): JSX.Element => {
    const { navigate } = useDashboard();
    const [t] = useTranslation();
    const socket = useSocket();
    const { data, isFetching, error, refetch } = useGetProjects();

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    useEffect(() => {
        if (!data || isFetching) {
            return;
        }

        const subscribedProjects: Record<string, bool> = {};
        for (let i = 0; i < PROJECT_TABS.length; ++i) {
            const tab = PROJECT_TABS[i];
            for (let j = 0; j < data[tab].length; ++j) {
                const project = data[tab][j];
                if (subscribedProjects[project.uid]) {
                    continue;
                }

                subscribedProjects[project.uid] = true;
                socket.subscribe(ESocketTopic.Project, project.uid);
            }
        }

        return () => {
            Object.keys(subscribedProjects).forEach((uid) => {
                socket.unsubscribe(ESocketTopic.Project, uid);
            });
        };
    }, [isFetching]);

    return (
        <>
            {!data ? (
                <SkeletonProjecTabs />
            ) : (
                <ProjectTabs
                    currentTab={currentTab}
                    refetchAllStarred={refetchAllStarred}
                    refetchAllProjects={refetch}
                    scrollAreaUpdater={scrollAreaUpdater}
                    projects={data}
                />
            )}
        </>
    );
});

export default ProjectPage;
