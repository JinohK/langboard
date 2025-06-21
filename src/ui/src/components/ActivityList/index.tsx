import { Box, Button, Flex, Loading } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import { TGetActivitiesForm } from "@/controllers/api/activity/useGetActivities";
import useCreateActivityTimeline from "@/core/hooks/activity/useCreateActivityTimeline";
import { AuthUser } from "@/core/models";
import { ActivityProvider, useActivity } from "@/core/providers/ActivityProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import React from "react";
import { useTranslation } from "react-i18next";

export interface IActivityListProps extends Pick<React.ComponentProps<typeof InfiniteScroller.Default>, "as"> {
    form: TGetActivitiesForm;
    currentUser: AuthUser.TModel;
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

function ActivityListInner({ as, currentUser, infiniteScrollerClassName, style, isUserView = false }: Omit<IActivityListProps, "form">): JSX.Element {
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
        <Box position="relative">
            {!activities.length && (
                <Flex justify="center" items="center" h="full" key={createShortUUID()}>
                    {t("activity.No Activities")}
                </Flex>
            )}
            <Box id={activityListIdRef.current} className={cn(infiniteScrollerClassName, "overflow-y-auto")} onScroll={checkOutdatedOnScroll}>
                {isRefreshing && <Loading variant="secondary" size="4" mt="4" />}
                <InfiniteScroller.Default
                    as={as}
                    row={Box}
                    scrollable={() => document.getElementById(activityListIdRef.current)}
                    loadMore={nextPage}
                    loader={<SkeletonActivity key={createShortUUID()} />}
                    hasMore={!isLastPage}
                    rowClassName="w-full p-1.5"
                    style={style}
                >
                    {activities.map((activity) => (
                        <ActivityTimeline activity={activity} references={activity.references} key={createShortUUID()} />
                    ))}
                </InfiniteScroller.Default>
            </Box>
            {countNewRecords > 0 && !isRefreshing && (
                <Button onClick={refreshList} size="sm" className="absolute left-1/2 top-1 z-50 -translate-x-1/2">
                    {t("activity.{count} New Activities", { count: countNewRecords })}
                </Button>
            )}
        </Box>
    );
}

export default ActivityList;
