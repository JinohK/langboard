import { Accordion } from "@/components/base";
import useGetProjects, { IProject } from "@/controllers/dashboard/useGetProjects";
import ProjectCardList from "@/pages/DashboardPage/components/ProjectCardList";
import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useState } from "react";
import { makeReactKey } from "@/core/utils/StringUtils";

function ProjectPage(): JSX.Element {
    const UNSTARRED_PROJECTS_LIMIT = 16;
    const [isScrolling, setIsScrolling] = useState(false);
    const [isUnstarredOpened, setIsUnstarredOpened] = useState(false);
    const { data: starred } = useGetProjects({ listType: "starred", page: 1, limit: 4 });
    const { data: recent } = useGetProjects({ listType: "recent", page: 1, limit: 4 });
    const {
        data: unstarred,
        fetchNextPage: unstarredNextPage,
        hasNextPage: unstarredHasMore,
        isFetchingNextPage: unstarredIsFetchingNextPage,
    } = useGetProjects(
        {
            listType: "unstarred",
            page: 1,
            limit: UNSTARRED_PROJECTS_LIMIT,
        },
        {
            getNextPageParam: (lastPage, _, lastPageParam) => {
                if (lastPage.total >= lastPageParam.page * lastPageParam.limit) {
                    return {
                        ...lastPageParam,
                        page: lastPageParam.page + 1,
                    };
                } else {
                    return undefined;
                }
            },
        }
    );

    const [unstarredProjects, setUnstarredProjects] = useState<IProject[]>([]);

    useEffect(() => {
        const newUnstarredProjects = [];
        for (let i = 0; i < (unstarred?.pages.length ?? 0); ++i) {
            newUnstarredProjects.push(...(unstarred?.pages[i].projects ?? []));
        }

        setUnstarredProjects(newUnstarredProjects);
    }, [unstarred]);

    const unstarredNextPageFn = () =>
        new Promise((resolve) => {
            if (isScrolling || unstarredIsFetchingNextPage) {
                return resolve(undefined);
            }

            setIsScrolling(true);
            setTimeout(async () => {
                const pageResult = await unstarredNextPage();
                setIsScrolling(false);
                resolve(pageResult);
            }, 2500);
        });

    return (
        <>
            <div className="hidden flex-col md:flex md:gap-5 lg:gap-7">
                <ProjectCardList title="dashboard.Starred Projects" projects={starred?.pages.at(-1)?.projects} />
                <ProjectCardList title="dashboard.Recent Projects" projects={recent?.pages.at(-1)?.projects} />
                <InfiniteScroll
                    scrollableTarget="main"
                    next={unstarredNextPageFn}
                    hasMore={unstarredHasMore && !unstarredIsFetchingNextPage}
                    scrollThreshold={0.9}
                    loader={<ProjectCardList className={isScrolling ? "" : "hidden"} isSkeleton count={UNSTARRED_PROJECTS_LIMIT / 2} title="" />}
                    dataLength={unstarredProjects.length}
                    className="!overflow-y-hidden"
                >
                    <ProjectCardList title="dashboard.Unstarred Projects" projects={unstarredProjects} />
                </InfiniteScroll>
            </div>
            <Accordion.Root
                type="single"
                collapsible
                className="md:hidden"
                onValueChange={(value) => setIsUnstarredOpened(value === makeReactKey("dashboard.Unstarred Projects"))}
            >
                <ProjectCardList isMobile title="dashboard.Starred Projects" projects={starred?.pages.at(-1)?.projects} />
                <ProjectCardList isMobile title="dashboard.Recent Projects" projects={recent?.pages.at(-1)?.projects} />
                <InfiniteScroll
                    scrollableTarget="mobile-main"
                    next={unstarredNextPageFn}
                    hasMore={unstarredHasMore && !unstarredIsFetchingNextPage && !isScrolling && isUnstarredOpened}
                    scrollThreshold={0.9}
                    loader={null}
                    dataLength={unstarredProjects.length}
                    className="!overflow-y-hidden"
                >
                    <ProjectCardList isMobile title="dashboard.Unstarred Projects" projects={unstarredProjects} />
                    <ProjectCardList className={isScrolling ? "" : "hidden"} isSkeleton count={1} title="" />
                </InfiniteScroll>
            </Accordion.Root>
        </>
    );
}

export default ProjectPage;
