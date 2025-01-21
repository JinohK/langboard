import { Box, Button, Flex, ScrollArea } from "@/components/base";
import InfiniteScroller, { IInfiniteScrollerProps } from "@/components/InfiniteScroller";
import useGetActivities, { TGetActivitiesForm } from "@/controllers/api/activity/useGetActivities";
import useCreateActivityTimeline from "@/core/hooks/activity/useCreateActivityTimeline";
import { ActivityModel, AuthUser } from "@/core/models";
import { createShortUUID } from "@/core/utils/StringUtils";
import React, { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface IAActivityListProps extends Pick<IInfiniteScrollerProps, "as"> {
    form: TGetActivitiesForm;
    currentUser: AuthUser.TModel;
    activities: ActivityModel.TModel[];
    scrollAreaClassName?: string;
    infiniteScrollerClassName?: string;
    isUserView?: bool;
}

function ActivityList({
    as,
    form,
    currentUser,
    activities: flatActivities,
    scrollAreaClassName,
    infiniteScrollerClassName,
    isUserView = false,
}: IAActivityListProps): JSX.Element {
    const [t] = useTranslation();
    const activities = useMemo(() => flatActivities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()), [flatActivities]);
    const { SkeletonActivity, ActivityTimeline } = useCreateActivityTimeline(currentUser, isUserView);
    const isFetchingRef = useRef(false);
    const isDelayingCheckOutdated = useRef(false);
    const delayCheckOutdatedTimeout = useRef<NodeJS.Timeout>(null);
    const { mutateAsync, isLastPage, countNewRecords, refresh, checkOutdated } = useGetActivities(form);
    const activityListId = useRef(createShortUUID());
    const nextPage = useCallback(async () => {
        if (isFetchingRef.current || isLastPage) {
            return false;
        }

        isFetchingRef.current = true;
        return await new Promise<bool>((resolve) => {
            setTimeout(async () => {
                await mutateAsync({});
                isFetchingRef.current = false;
                resolve(true);
            }, 2500);
        });
    }, [isLastPage, mutateAsync]);
    const refreshList = useCallback(async () => {
        if (isFetchingRef.current) {
            return;
        }

        const curIsDelayingCheckOutdated = isDelayingCheckOutdated.current;
        isDelayingCheckOutdated.current = false;
        const list = document.getElementById(activityListId.current)!;

        list.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        setTimeout(() => {
            if (!delayCheckOutdatedTimeout.current && curIsDelayingCheckOutdated) {
                isDelayingCheckOutdated.current = false;
            } else {
                isDelayingCheckOutdated.current = curIsDelayingCheckOutdated;
            }
        }, 0);
        isFetchingRef.current = true;
        await refresh();
        isFetchingRef.current = false;
        setTimeout(() => {
            list.scrollTop = 0;
        }, 0);
    }, [refresh]);
    const checkOutdatedOnScroll = useCallback(
        async (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement;
            if (isFetchingRef.current || isDelayingCheckOutdated.current || target.scrollTop < target.scrollHeight * 0.3) {
                return;
            }

            isDelayingCheckOutdated.current = true;

            await checkOutdated();

            delayCheckOutdatedTimeout.current = setTimeout(() => {
                isDelayingCheckOutdated.current = false;
                delayCheckOutdatedTimeout.current = null;
            }, 5000);
        },
        [checkOutdated]
    );

    return (
        <Box position="relative">
            <ScrollArea.Root
                viewportId={activityListId.current}
                mutable={activities}
                className={scrollAreaClassName}
                onScroll={checkOutdatedOnScroll}
            >
                <InfiniteScroller
                    as={as}
                    scrollable={() => document.getElementById(activityListId.current)}
                    loadMore={nextPage}
                    loader={<SkeletonActivity key={createShortUUID()} />}
                    hasMore={!isLastPage}
                    threshold={140}
                    className={infiniteScrollerClassName}
                >
                    {!activities.length && (
                        <Flex justify="center" items="center" h="full">
                            {t("activity.No Activities")}
                        </Flex>
                    )}
                    <Flex direction="col" gap="2">
                        {activities.map((activity) => (
                            <ActivityTimeline activity={activity} references={activity.references} key={createShortUUID()} />
                        ))}
                    </Flex>
                    <Box h="3" />
                </InfiniteScroller>
            </ScrollArea.Root>
            {countNewRecords > 0 && (
                <Button onClick={refreshList} size="sm" className="absolute left-1/2 top-1 z-50 -translate-x-1/2">
                    {t("activity.{count} New Activities", { count: countNewRecords })}
                </Button>
            )}
        </Box>
    );
}

export default ActivityList;
