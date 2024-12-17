import { Dialog, ScrollArea } from "@/components/base";
import { useAuth } from "@/core/providers/AuthProvider";
import InfiniteScroll from "react-infinite-scroller";
import { useEffect, useRef, useState } from "react";
import useGetUserActivities from "@/controllers/api/activity/useGetUserActivities";
import { Activity } from "@/core/models";
import { createShortUUID } from "@/core/utils/StringUtils";
import useCreateActivityTimeline from "@/core/hooks/useCreateActivityTimeline";
import { cn } from "@/core/utils/ComponentUtils";
import { TimelineVariants } from "@/components/base/Timeline";
import { usePageLoader } from "@/core/providers/PageLoaderProvider";

export interface IMyActivityDialogProps {
    opened: bool;
    setOpened: (opened: bool) => void;
}

function MyActivityDialog({ opened, setOpened }: IMyActivityDialogProps): JSX.Element | null {
    const { setIsLoadingRef } = usePageLoader();
    const { aboutMe } = useAuth();
    const pageRef = useRef(1);
    const user = aboutMe();
    const [activities, setActivities] = useState<Activity.Interface[]>([]);
    const { SkeletonActivity, ActivityTimeline } = useCreateActivityTimeline("user");
    const {
        data: rawActivities,
        fetchNextPage,
        hasNextPage,
    } = useGetUserActivities(
        { page: pageRef.current, limit: 20 },
        {
            getNextPageParam: (lastPage, _, lastPageParam) => {
                if (lastPage.activities.length === lastPageParam.limit) {
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
        setIsLoadingRef.current(false);
    }, []);

    useEffect(() => {
        if (rawActivities) {
            setActivities((prev) => {
                return [
                    ...prev,
                    ...rawActivities.pages
                        .flatMap((page) => page.activities)
                        .filter((activity) => !prev.some((prevActivity) => prevActivity.id === activity.id)),
                ];
            });
            setActivities(rawActivities.pages.flatMap((page) => page.activities));
        }
    }, [rawActivities]);

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

    if (!user) {
        return null;
    }

    return (
        <Dialog.Root open={opened} onOpenChange={setOpened}>
            <Dialog.Title hidden />
            <Dialog.Content className="p-0 pb-4 pt-8 sm:max-w-md" aria-describedby="">
                <ScrollArea.Root viewportId={userActivityListId.current}>
                    <InfiniteScroll
                        element="ul"
                        getScrollParent={() => document.getElementById(userActivityListId.current)}
                        loadMore={nextPage}
                        loader={<SkeletonActivity key={createShortUUID()} />}
                        hasMore={hasNextPage}
                        threshold={140}
                        initialLoad={false}
                        className={cn(TimelineVariants(), "max-h-[calc(100vh_-_theme(spacing.48))] px-4 pb-2.5")}
                        useWindow={false}
                        pageStart={1}
                    >
                        {activities.map((activity) => (
                            <ActivityTimeline activity={activity} user={user} isCurrentUser key={createShortUUID()} />
                        ))}
                    </InfiniteScroll>
                    <ScrollArea.Bar mutable={activities} />
                </ScrollArea.Root>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default MyActivityDialog;
