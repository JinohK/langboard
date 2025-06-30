import { memo, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { Box, Skeleton, Tabs } from "@/components/base";
import { ROUTES } from "@/core/routing/constants";
import { makeReactKey } from "@/core/utils/StringUtils";
import ProjectList, { SkeletonProjectList } from "@/pages/DashboardPage/components/ProjectList";
import { PROJECT_TABS, TProjectTab, TProjectTabRoute } from "@/pages/DashboardPage/constants";
import { Project } from "@/core/models";
import { usePageNavigateRef } from "@/core/hooks/usePageNavigate";

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
    currentTab: TProjectTab;
    updateStarredProjects: React.DispatchWithoutAction;
    scrollAreaUpdater: [number, React.DispatchWithoutAction];
}

const ProjectTabs = memo(({ currentTab, updateStarredProjects: updateHeaderStarredProjects, scrollAreaUpdater }: IProjectTabsProps) => {
    const navigate = usePageNavigateRef();
    const [updatedStarredProjects, updateStarredProjects] = useReducer((x) => x + 1, 0);
    const [t] = useTranslation();
    const projects = Project.Model.useModels(
        (model) => {
            switch (currentTab) {
                case "starred":
                    return model.starred;
                case "unstarred":
                    return !model.starred;
                default:
                    return true;
            }
        },
        [currentTab, updatedStarredProjects]
    );

    const currentProjects = projects.sort((a, b) => {
        switch (currentTab) {
            case "recent":
                return a.last_viewed_at > b.last_viewed_at ? -1 : 1;
            default:
                return a.updated_at > b.updated_at ? -1 : 1;
        }
    });

    const navigateToTab = (tab: IProjectTabsProps["currentTab"]) => {
        if (tab === currentTab) {
            return;
        }

        navigate(ROUTES.DASHBOARD.PROJECTS[tab.toUpperCase() as TProjectTabRoute]);
    };

    return (
        <Tabs.Provider value={currentTab}>
            <Box px="2">
                <Tabs.List className="grid w-full grid-cols-4 gap-1">
                    {PROJECT_TABS.map((tab) => (
                        <Tabs.Trigger value={tab} key={makeReactKey(`dashboard.tabs.${tab}`)} onClick={() => navigateToTab(tab)}>
                            {t(`dashboard.tabs.${tab}`)}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
            </Box>
            <Tabs.Content value={currentTab}>
                {currentProjects.length === 0 ? (
                    <h2 className="py-3 text-center text-lg text-accent-foreground">{t("dashboard.No projects found")}</h2>
                ) : (
                    <ProjectList
                        projects={currentProjects}
                        updateStarredProjects={() => {
                            updateHeaderStarredProjects();
                            updateStarredProjects();
                        }}
                        scrollAreaUpdater={scrollAreaUpdater}
                    />
                )}
            </Tabs.Content>
        </Tabs.Provider>
    );
});

export default ProjectTabs;
