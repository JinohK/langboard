/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Flex, ScrollArea } from "@/components/base";
import InfiniteScroller, { IInfiniteScrollerProps } from "@/components/InfiniteScroller";
import useCreateActivityTimeline from "@/core/hooks/activity/useCreateActivityTimeline";
import { ActivityModel } from "@/core/models";
import { createShortUUID } from "@/core/utils/StringUtils";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { useRef } from "react";

export interface IAActivityListProps extends Pick<IInfiniteScrollerProps, "as"> {
    mutation: () => {
        isLastPage: bool;
        isOutdated: bool;
        mutateAsync: UseMutateAsyncFunction<any, any, any>;
    };
    activities: ActivityModel.TModel[];
    scrollAreaClassName?: string;
    infiniteScrollerClassName?: string;
    isCurrentUser?: bool;
}

function ActivityList({
    as,
    mutation,
    activities,
    scrollAreaClassName,
    infiniteScrollerClassName,
    isCurrentUser = false,
}: IAActivityListProps): JSX.Element {
    const { SkeletonActivity, ActivityTimeline } = useCreateActivityTimeline();
    const isFetchingRef = useRef(false);
    const { mutateAsync, isLastPage, isOutdated } = mutation();
    const activityListId = useRef(createShortUUID());

    const nextPage = async () => {
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
    };

    return (
        <ScrollArea.Root viewportId={activityListId.current} mutable={activities} className={scrollAreaClassName}>
            <InfiniteScroller
                as={as}
                scrollable={() => document.getElementById(activityListId.current)}
                loadMore={nextPage}
                loader={<SkeletonActivity key={createShortUUID()} />}
                hasMore={!isLastPage}
                threshold={140}
                className={infiniteScrollerClassName}
            >
                <Flex direction="col" gap="2">
                    {activities.map((activity) => (
                        <ActivityTimeline activity={activity} isCurrentUser={isCurrentUser} key={createShortUUID()} />
                    ))}
                </Flex>
                <Box h="3" />
            </InfiniteScroller>
        </ScrollArea.Root>
    );
}

export default ActivityList;
