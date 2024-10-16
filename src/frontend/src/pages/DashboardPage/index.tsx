import { Accordion } from "@/components/base";
import { IHeaderNavItem } from "@/components/Header/types";
import Layout from "@/components/Layout";
import { ISidebarNavItem } from "@/components/Sidebar/types";
import useGetProjects, { IProject } from "@/controllers/dashboard/useGetProjects";
import { ROUTES } from "@/core/routing/constants";
import ProjectCardList from "@/pages/DashboardPage/ProjectCardList";
import { useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useState } from "react";

function DashboardPage(): JSX.Element {
    const UNSTARRED_PROJECTS_LIMIT = 16;

    const navigate = useNavigate();
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

    const headerNavs: IHeaderNavItem[] = [
        {
            name: "Projects",
            onClick: () => {
                navigate(ROUTES.DASHBOARD);
            },
            active: true,
        },
        {
            name: "Tasks",
        },
        {
            name: "Starred",
            subNavs: [],
        },
        {
            name: "Tracking",
        },
    ];
    const sidebarNavs: ISidebarNavItem[] = [
        {
            icon: "plus",
            name: "Create New Project",
        },
    ];

    return (
        <Layout headerNavs={headerNavs} sidebarNavs={sidebarNavs}>
            <div className="hidden flex-col md:flex md:gap-5 lg:gap-7">
                <ProjectCardList isMobile={false} title="Starred Projects" projects={starred?.pages.at(-1)?.projects} />
                <ProjectCardList isMobile={false} title="Recent Projects" projects={recent?.pages.at(-1)?.projects} />
                <InfiniteScroll
                    scrollableTarget="main"
                    next={unstarredNextPage}
                    hasMore={unstarredHasMore && !unstarredIsFetchingNextPage}
                    loader={<ProjectCardList isSkeleton={true} count={UNSTARRED_PROJECTS_LIMIT / 2} title="" />}
                    dataLength={unstarredProjects.length}
                >
                    <ProjectCardList isMobile={false} title="Unstarred Projects" projects={unstarredProjects} />
                </InfiniteScroll>
            </div>
            <Accordion.Root type="single" collapsible className="md:hidden">
                <ProjectCardList isMobile title="Starred Projects" projects={starred?.pages.at(-1)?.projects} />
                <ProjectCardList isMobile title="Recent Projects" projects={recent?.pages.at(-1)?.projects} />
                <ProjectCardList isMobile title="Unstarred Projects" projects={unstarredProjects} />
            </Accordion.Root>
        </Layout>
    );
}

export default DashboardPage;
