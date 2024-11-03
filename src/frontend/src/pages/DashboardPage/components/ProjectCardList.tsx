import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroller";
import { IDashboardProject } from "@/controllers/dashboard/useGetProjects";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import ProjectCard from "@/pages/DashboardPage/components/ProjectCard";

export interface IProjectCardListProps {
    curPage: number;
    projects: IDashboardProject[];
    className?: string;
    hasMore: bool;
    refetchAllStarred: () => Promise<unknown>;
    refetchProjects: () => Promise<unknown>;
    fetchNextPage: () => Promise<unknown>;
}

function ProjectCardList({
    curPage,
    projects,
    className,
    hasMore,
    refetchAllStarred,
    refetchProjects,
    fetchNextPage,
}: IProjectCardListProps): JSX.Element | null {
    const [projectCards, setProjectCards] = useState<JSX.Element[]>([]);
    const skeletonCards = [];

    for (let i = 0; i < 4; ++i) {
        skeletonCards.push(<ProjectCard isSkeleton={true} key={createShortUUID()} />);
    }

    useEffect(() => {
        const newProjectCards: JSX.Element[] = [];
        for (let i = 0; i < projects.length; ++i) {
            const project = projects[i];
            newProjectCards.push(
                <ProjectCard project={project} key={project.uid} refetchAllStarred={refetchAllStarred} refetchProjects={refetchProjects} />
            );
        }

        setProjectCards(newProjectCards);
    }, [projects]);

    const nextPage = (page: number) => {
        if (page - curPage > 1) {
            return;
        }

        new Promise((resolve) => {
            setTimeout(async () => {
                const result = await fetchNextPage();
                resolve(result);
            }, 2500);
        });
    };

    return (
        <>
            <InfiniteScroll
                getScrollParent={() => document.getElementById("main")}
                loadMore={nextPage}
                hasMore={hasMore}
                threshold={140}
                loader={
                    <div className="mt-4" key={createShortUUID()}>
                        <div className="hidden gap-4 sm:grid-cols-2 md:grid lg:grid-cols-4">{skeletonCards}</div>
                        <div className="hidden gap-4 sm:grid sm:grid-cols-2 md:hidden lg:grid-cols-4">
                            {skeletonCards[0]}
                            {skeletonCards[1]}
                        </div>
                        <div className="grid gap-4 sm:hidden sm:grid-cols-2 lg:grid-cols-4">{skeletonCards[0]}</div>
                    </div>
                }
                initialLoad={false}
                className={cn("!overflow-y-hidden", className)}
                useWindow={false}
                pageStart={1}
            >
                <div className="mt-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{projectCards}</div>
                </div>
            </InfiniteScroll>
        </>
    );
}

export default ProjectCardList;
