import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Skeleton, Tabs } from "@/components/base";
import { IGetProjectsResponse } from "@/controllers/api/dashboard/useGetProjects";
import { ROUTES } from "@/core/routing/constants";
import { makeReactKey } from "@/core/utils/StringUtils";
import ProjectList, { SkeletonProjectList } from "@/pages/DashboardPage/components/ProjectList";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";
import { useDashboard } from "@/core/providers/DashboardProvider";
import { PROJECT_TABS } from "@/pages/DashboardPage/constants";

export function SkeletonProjecTabs() {
    return (
        <>
            <Box display="grid" gap="1" h="10" p="1" className="grid-cols-4">
                <Skeleton h="8" />
                <Skeleton h="8" />
                <Skeleton h="8" />
                <Skeleton h="8" />
            </Box>
            <Box mt="2">
                <SkeletonProjectList />
            </Box>
        </>
    );
}

interface IProjectTabsProps {
    currentTab: keyof IGetProjectsResponse;
    refetchAllStarred: () => Promise<unknown>;
    scrollAreaUpdater: [number, React.DispatchWithoutAction];
    projects: IGetProjectsResponse;
    refetchAllProjects: () => Promise<unknown>;
}

const ProjectTabs = memo(({ currentTab: curTab, refetchAllStarred, refetchAllProjects, scrollAreaUpdater, projects }: IProjectTabsProps) => {
    const { setIsLoadingRef } = usePageLoader();
    const { navigate } = useDashboard();
    const [t] = useTranslation();
    const [currentTab, setCurrentTab] = useState(curTab);
    const currentProjects = projects[currentTab];

    const navigateToTab = (tab: keyof IGetProjectsResponse) => {
        if (tab === currentTab) {
            return;
        }

        navigate(ROUTES.DASHBOARD.PROJECTS[tab.toUpperCase() as "ALL" | "STARRED" | "RECENT" | "UNSTARRED"]);
        setCurrentTab(tab);
    };

    useEffect(() => {
        setIsLoadingRef.current(false);
    }, [currentTab]);

    return (
        <Tabs.Root value={currentTab}>
            <Tabs.List className="grid w-full grid-cols-4 gap-1">
                {PROJECT_TABS.map((tab) => (
                    <Tabs.Trigger value={tab} key={makeReactKey(`dashboard.tabs.${tab}`)} onClick={() => navigateToTab(tab)}>
                        {t(`dashboard.tabs.${tab}`)}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>
            <Tabs.Content value={currentTab}>
                {currentProjects.length === 0 ? (
                    <h2 className="pb-3 text-center text-lg text-accent-foreground">{t("dashboard.No projects found")}</h2>
                ) : (
                    <ProjectList
                        projects={currentProjects}
                        refetchAllStarred={refetchAllStarred}
                        refetchAllProjects={refetchAllProjects}
                        scrollAreaUpdater={scrollAreaUpdater}
                    />
                )}
            </Tabs.Content>
        </Tabs.Root>
    );
});

export default ProjectTabs;
