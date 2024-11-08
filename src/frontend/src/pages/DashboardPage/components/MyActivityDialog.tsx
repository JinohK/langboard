import { Dialog, ScrollArea, Skeleton, Timeline } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import InfiniteScroll from "react-infinite-scroller";
import { useEffect, useRef, useState } from "react";
import useGetUserActivities from "@/controllers/activity/useGetUserActivities";
import { Activity } from "@/core/models";
import { createShortUUID } from "@/core/utils/StringUtils";
import useCreateActivityTimeline from "@/core/hooks/useCreateActivityTimeline";

export interface IMyActivityDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function SkeletonActivity(): JSX.Element {
    return (
        <Timeline.Root className="max-h-[calc(100vh_-_theme(spacing.48))] px-4">
            <Timeline.Item status="done" className="gap-x-2">
                <Timeline.Heading>
                    <Skeleton className="block h-6 w-44" />
                </Timeline.Heading>
                <Timeline.Dot status="custom" customIcon={<Skeleton className="inline-block size-8 rounded-full" />} className="size-8 border-none" />
                <Timeline.Line done className="animate-pulse rounded-md bg-primary/10" />
                <Timeline.Content>
                    <Skeleton className="block h-14 w-56" />
                </Timeline.Content>
            </Timeline.Item>
        </Timeline.Root>
    );
}

function MyActivityDialog({ opened, setOpened }: IMyActivityDialogProps): JSX.Element | null {
    const { aboutMe } = useAuth();
    const pageRef = useRef(1);
    const user = aboutMe();
    const [activities, setActivities] = useState<Activity.Interface[]>([]);
    const { create: createTimeline } = useCreateActivityTimeline("user");
    const {
        data: rawActivities,
        fetchNextPage,
        hasNextPage,
    } = useGetUserActivities(
        { page: pageRef.current, limit: 10 },
        {
            getNextPageParam: (lastPage, _, lastPageParam) => {
                if (lastPage.activities.length == lastPageParam.limit) {
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
    const userActivityListId = useRef(createShortUUID());

    useEffect(() => {
        if (rawActivities) {
            setActivities(rawActivities.pages.flatMap((page) => page.activities));
        }
    }, [rawActivities]);

    if (!user) {
        return null;
    }

    const nextPage = (page: number) => {
        if (page - pageRef.current > 1) {
            return;
        }

        new Promise((resolve) => {
            setTimeout(async () => {
                const result = await fetchNextPage();
                pageRef.current = page;
                resolve(result);
            }, 2500);
        });
    };

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-md" aria-describedby="">
                <ScrollArea.Root viewportId={userActivityListId.current}>
                    <InfiniteScroll
                        getScrollParent={() => document.getElementById(userActivityListId.current)}
                        loadMore={nextPage}
                        loader={<SkeletonActivity key={createShortUUID()} />}
                        hasMore={hasNextPage}
                        threshold={140}
                        initialLoad={false}
                        className="pb-2.5"
                        useWindow={false}
                        pageStart={1}
                    >
                        <Timeline.Root className="max-h-[calc(100vh_-_theme(spacing.48))] px-4">
                            {activities.map((activity) => createTimeline(activity, user, true))}
                        </Timeline.Root>
                    </InfiniteScroll>
                </ScrollArea.Root>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default MyActivityDialog;
