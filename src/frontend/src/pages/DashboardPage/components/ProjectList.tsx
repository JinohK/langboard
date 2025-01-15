import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import ProjectCard, { SkeletonProjectCard } from "@/pages/DashboardPage/components/ProjectCard";
import { Box } from "@/components/base";
import { Project } from "@/core/models";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import { memo } from "react";
import InfiniteScroller from "@/components/InfiniteScroller";

export function SkeletonProjectList() {
    const skeletonCards = [];
    for (let i = 0; i < 4; ++i) {
        skeletonCards.push(<SkeletonProjectCard key={createShortUUID()} />);
    }

    return (
        <Box mt="4">
            <Box display={{ initial: "hidden", md: "grid" }} gap="4" className="md:grid-cols-2 lg:grid-cols-4">
                {skeletonCards}
            </Box>
            <Box display={{ initial: "hidden", sm: "grid", md: "hidden" }} gap="4" className="sm:grid-cols-2 lg:grid-cols-4">
                {skeletonCards.slice(0, 2)}
            </Box>
            <Box display={{ initial: "grid", sm: "hidden" }} gap="4" className="sm:grid-cols-2 lg:grid-cols-4">
                {skeletonCards[0]}
            </Box>
        </Box>
    );
}

export interface IProjectListProps {
    projects: Project.TModel[];
    updateStarredProjects: React.DispatchWithoutAction;
    scrollAreaUpdater: [number, React.DispatchWithoutAction];
    className?: string;
}

const ProjectList = memo(({ projects, updateStarredProjects, scrollAreaUpdater, className }: IProjectListProps): JSX.Element | null => {
    const PAGE_SIZE = 16;
    const { items, nextPage, hasMore } = useInfiniteScrollPager({ allItems: projects, size: PAGE_SIZE, updater: scrollAreaUpdater });
    const skeletonCards = [];
    for (let i = 0; i < 4; ++i) {
        skeletonCards.push(<SkeletonProjectCard key={createShortUUID()} />);
    }

    return (
        <InfiniteScroller
            scrollable={() => document.getElementById("main")}
            loadMore={nextPage}
            hasMore={hasMore}
            threshold={78}
            loader={<SkeletonProjectList key={createShortUUID()} />}
            className={cn("!overflow-y-hidden", className)}
        >
            <Box mt="4">
                <Box display="grid" gap="4" className="sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((project) => (
                        <ProjectCard key={`${project.uid}-${createShortUUID()}`} project={project} updateStarredProjects={updateStarredProjects} />
                    ))}
                </Box>
            </Box>
        </InfiniteScroller>
    );
});

export default ProjectList;
