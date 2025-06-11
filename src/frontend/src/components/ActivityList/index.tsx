import { Box, Button, Flex, Loading } from "@/components/base";
import InfiniteScroller, { IInfiniteScrollerProps } from "@/components/InfiniteScroller";
import { TGetActivitiesForm } from "@/controllers/api/activity/useGetActivities";
import useCreateActivityTimeline from "@/core/hooks/activity/useCreateActivityTimeline";
import { AuthUser } from "@/core/models";
import { ActivityProvider, useActivity } from "@/core/providers/ActivityProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import React from "react";
import { useTranslation } from "react-i18next";

export interface IActivityListProps extends Pick<IInfiniteScrollerProps, "as"> {
    form: TGetActivitiesForm;
    currentUser: AuthUser.TModel;
    scrollAreaClassName?: string;
    infiniteScrollerClassName?: string;
    style?: React.CSSProperties;
    isUserView?: bool;
}

function ActivityList(props: IActivityListProps) {
    return (
        <ActivityProvider form={props.form}>
            <ActivityListInner {...props} />
        </ActivityProvider>
    );
}

function ActivityListInner({
    as,
    currentUser,
    scrollAreaClassName,
    infiniteScrollerClassName,
    style,
    isUserView = false,
}: Omit<IActivityListProps, "form">): JSX.Element {
    const [t] = useTranslation();
    const {
        activities,
        activityListIdRef,
        isFetchingRef,
        isDelayingCheckOutdated,
        delayCheckOutdatedTimeoutRef,
        isLastPage,
        countNewRecords,
        isRefreshing,
        nextPage,
        refreshList,
        checkOutdated,
    } = useActivity();
    const { SkeletonActivity, ActivityTimeline } = useCreateActivityTimeline(currentUser, isUserView);
    const checkOutdatedOnScroll = React.useCallback(
        async (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement;
            if (isFetchingRef.current || isDelayingCheckOutdated.current || target.scrollTop < target.scrollHeight * 0.3) {
                return;
            }

            isDelayingCheckOutdated.current = true;

            await checkOutdated();

            delayCheckOutdatedTimeoutRef.current = setTimeout(() => {
                isDelayingCheckOutdated.current = false;
                delayCheckOutdatedTimeoutRef.current = null;
            }, 5000);
        },
        [checkOutdated]
    );

    return (
        <Box
            id={activityListIdRef.current}
            position="relative"
            className={cn("overflow-y-auto", scrollAreaClassName)}
            onScroll={checkOutdatedOnScroll}
        >
            {isRefreshing && <Loading variant="secondary" size="4" mt="4" />}
            <InfiniteScroller
                as={as}
                scrollable={() => document.getElementById(activityListIdRef.current)}
                loadMore={nextPage}
                loader={<SkeletonActivity key={createShortUUID()} />}
                hasMore={!isLastPage}
                threshold={140}
                className={infiniteScrollerClassName}
                style={style}
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
                {!!activities.length && <Box h="3" />}
            </InfiniteScroller>
            {countNewRecords > 0 && !isRefreshing && (
                <Button onClick={refreshList} size="sm" className="fixed left-1/2 top-1 z-50 -translate-x-1/2">
                    {t("activity.{count} New Activities", { count: countNewRecords })}
                </Button>
            )}
        </Box>
    );
}

export default ActivityList;
