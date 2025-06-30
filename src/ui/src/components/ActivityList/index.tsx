import { Box, Button, Flex, Loading } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import { TGetActivitiesForm } from "@/controllers/api/shared/types";
import useCreateActivityTimeline from "@/core/hooks/activity/useCreateActivityTimeline";
import { ActivityModel, AuthUser } from "@/core/models";
import { RefreshableListProvider, useRefreshableList } from "@/core/providers/RefreshableListProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface IActivityListProps extends Pick<React.ComponentProps<typeof InfiniteScroller.Default>, "as"> {
    form: TGetActivitiesForm;
    currentUser: AuthUser.TModel;
    outerClassName?: string;
    outerStyle?: React.CSSProperties;
    isUserView?: bool;
}

const PAGE_LIMIT = 15;

function ActivityList({ form, ...props }: IActivityListProps) {
    const activityFilter = useMemo(() => {
        switch (form.type) {
            case "user":
                return (model: ActivityModel.TModel) => model.filterable_type === "user" && model.filterable_uid === form.user_uid;
            case "project":
                return (model: ActivityModel.TModel) => model.filterable_type === "project" && model.filterable_uid === form.project_uid;
            case "card":
                return (model: ActivityModel.TModel) =>
                    model.filterable_type === "project" &&
                    model.filterable_uid === form.project_uid &&
                    model.sub_filterable_type === "card" &&
                    model.sub_filterable_uid === form.card_uid;
            case "project_wiki":
                return (model: ActivityModel.TModel) =>
                    model.filterable_type === "project" &&
                    model.filterable_uid === form.project_uid &&
                    model.sub_filterable_type === "project_wiki" &&
                    model.sub_filterable_uid === form.wiki_uid;
            case "project_assignee":
                return (model: ActivityModel.TModel) => model.filterable_type === "user" && model.filterable_uid === form.assignee_uid;
            default:
                throw new Error("Invalid activity type");
        }
    }, [form.type]);
    const activities = ActivityModel.Model.useModels(activityFilter, [activityFilter]);

    return (
        <RefreshableListProvider
            models={activities}
            form={form}
            limit={PAGE_LIMIT}
            prepareData={(models, data) => {
                if (!data.references) {
                    return;
                }

                for (let i = 0; i < models.length; ++i) {
                    models[i].references = data.references;
                }
            }}
        >
            <ActivityListInner {...props} />
        </RefreshableListProvider>
    );
}

function ActivityListInner({ as, currentUser, outerClassName, outerStyle, isUserView = false }: Omit<IActivityListProps, "form">): JSX.Element {
    const [t] = useTranslation();
    const {
        models: activities,
        listIdRef,
        isLastPage,
        countNewRecords,
        isRefreshing,
        nextPage,
        refreshList,
        checkOutdatedOnScroll,
    } = useRefreshableList<"ActivityModel">();
    const { SkeletonActivity, ActivityTimeline } = useCreateActivityTimeline(currentUser, isUserView);

    return (
        <Box position="relative">
            {!activities.length && (
                <Flex justify="center" items="center" h="full">
                    {t("activity.No activities")}
                </Flex>
            )}
            <Box id={listIdRef.current} className={cn(outerClassName, "overflow-y-auto")} style={outerStyle} onScroll={checkOutdatedOnScroll}>
                {isRefreshing && <Loading variant="secondary" size="4" my="2" />}
                <InfiniteScroller.Default
                    as={as}
                    row={Box}
                    scrollable={() => document.getElementById(listIdRef.current)}
                    loadMore={nextPage}
                    loader={<SkeletonActivity key={createShortUUID()} />}
                    hasMore={!isLastPage}
                    totalCount={activities.length}
                    rowClassName="w-full p-1.5"
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
