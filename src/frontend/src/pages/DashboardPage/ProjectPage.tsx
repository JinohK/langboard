import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useGetProjects from "@/controllers/api/dashboard/useGetProjects";
import { ROUTES } from "@/core/routing/constants";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { useDashboard } from "@/core/providers/DashboardProvider";
import ProjectTabs, { SkeletonProjecTabs } from "@/pages/DashboardPage/components/ProjectTabs";
import { usePageHeader } from "@/core/providers/PageHeaderProvider";
import { TProjectTab } from "@/pages/DashboardPage/constants";

interface IProjectPageProps {
    currentTab: TProjectTab;
    updateStarredProjects: React.DispatchWithoutAction;
    scrollAreaUpdater: [number, React.DispatchWithoutAction];
}

const ProjectPage = memo(({ currentTab, updateStarredProjects, scrollAreaUpdater }: IProjectPageProps): JSX.Element => {
    const { setIsLoadingRef, setPageAliasRef } = usePageHeader();
    const { navigate, currentUser } = useDashboard();
    const [t] = useTranslation();
    const { data, isFetching, error } = useGetProjects();

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
        setPageAliasRef.current("Dashboard");
        if (!data || isFetching || !currentUser) {
            return;
        }

        setIsLoadingRef.current(false);
    }, [currentUser, isFetching]);

    return (
        <>
            {!data ? (
                <SkeletonProjecTabs />
            ) : (
                <ProjectTabs currentTab={currentTab} updateStarredProjects={updateStarredProjects} scrollAreaUpdater={scrollAreaUpdater} />
            )}
        </>
    );
});

export default ProjectPage;
