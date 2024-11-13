import { InfiniteData } from "@tanstack/react-query";
import { memo, useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Tabs } from "@/components/base";
import useGetProjects, { IDashboardProject, IGetProjectsForm, IGetProjectsResponse } from "@/controllers/dashboard/useGetProjects";
import { ROUTES } from "@/core/routing/constants";
import { makeReactKey } from "@/core/utils/StringUtils";
import ProjectCardList from "@/pages/DashboardPage/components/ProjectCardList";

interface IProjectPageProps {
    currentTab: IGetProjectsForm["listType"];
    refetchAllStarred: () => Promise<unknown>;
    updateScrollArea: React.DispatchWithoutAction;
}

const MAX_PROJECTS_PER_PAGE = 16;
const TABS: IGetProjectsForm["listType"][] = ["all", "starred", "recent", "unstarred"];
const cachedProjectQueries: Record<
    IGetProjectsForm["listType"],
    { params: IGetProjectsForm; data: InfiniteData<IGetProjectsResponse, IGetProjectsForm> }
> = {
    all: { params: { listType: "all", page: 1, limit: MAX_PROJECTS_PER_PAGE }, data: { pages: [], pageParams: [] } },
    starred: { params: { listType: "starred", page: 1, limit: MAX_PROJECTS_PER_PAGE }, data: { pages: [], pageParams: [] } },
    recent: { params: { listType: "recent", page: 1, limit: MAX_PROJECTS_PER_PAGE }, data: { pages: [], pageParams: [] } },
    unstarred: { params: { listType: "unstarred", page: 1, limit: MAX_PROJECTS_PER_PAGE }, data: { pages: [], pageParams: [] } },
};

const ProjectPage = memo(({ currentTab, refetchAllStarred, updateScrollArea }: IProjectPageProps): JSX.Element => {
    const [t] = useTranslation();
    const navigate = useNavigate();
    const currentProjectQuery = cachedProjectQueries[currentTab];
    const {
        data: rawProjects,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = useGetProjects(currentProjectQuery.params, {
        getNextPageParam: (lastPage, _, lastPageParam) => {
            if (lastPage.projects.length === lastPageParam.limit) {
                return {
                    ...lastPageParam,
                    page: lastPageParam.page + 1,
                };
            } else {
                return undefined;
            }
        },
    });
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const projects: IDashboardProject[] = currentProjectQuery.data.pages.flatMap((page) => page.projects);

    useEffect(() => {
        if (rawProjects) {
            currentProjectQuery.data = rawProjects;
            projects.splice(0);
            projects.push(...currentProjectQuery.data.pages.flatMap((page) => page.projects));
            forceUpdate();
        }
        updateScrollArea();
    }, [rawProjects]);

    return (
        <Tabs.Root value={currentTab}>
            <Tabs.List className="grid w-full grid-cols-4">
                {TABS.map((tab) => (
                    <Tabs.Trigger
                        value={tab}
                        key={makeReactKey(`dashboard.tabs.${tab}`)}
                        onClick={() => navigate(ROUTES.DASHBOARD.PROJECTS[tab.toUpperCase() as "ALL" | "STARRED" | "RECENT" | "UNSTARRED"])}
                    >
                        {t(`dashboard.tabs.${tab}`)}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>
            <Tabs.Content value={currentTab}>
                {projects.length === 0 ? (
                    <h2 className="pb-3 text-center text-lg text-accent-foreground">{t("dashboard.No projects found")}</h2>
                ) : (
                    <ProjectCardList
                        curPage={currentProjectQuery.data.pageParams.length}
                        projects={projects}
                        hasMore={hasNextPage}
                        refetchAllStarred={refetchAllStarred}
                        refetchProjects={refetch}
                        fetchNextPage={fetchNextPage}
                    />
                )}
            </Tabs.Content>
        </Tabs.Root>
    );
});

export default ProjectPage;
