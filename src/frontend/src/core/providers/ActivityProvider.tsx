import useGetActivities, { TGetActivitiesForm } from "@/controllers/api/activity/useGetActivities";
import { ActivityModel } from "@/core/models";
import { createShortUUID } from "@/core/utils/StringUtils";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface IActivityContext {
    activities: ActivityModel.TModel[];
    activityListIdRef: React.RefObject<string>;
    isFetchingRef: React.RefObject<bool>;
    isDelayingCheckOutdated: React.RefObject<bool>;
    delayCheckOutdatedTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
    isLastPage: bool;
    countNewRecords: number;
    nextPage: () => Promise<bool>;
    refreshList: () => Promise<void>;
    checkOutdated: () => Promise<void>;
}

interface IActivityProps {
    form: TGetActivitiesForm;
    children: React.ReactNode;
}

const initialContext = {
    activities: [],
    activityListIdRef: { current: "" },
    isFetchingRef: { current: false },
    isDelayingCheckOutdated: { current: false },
    delayCheckOutdatedTimeoutRef: { current: null },
    isLastPage: true,
    countNewRecords: 0,
    nextPage: async () => false,
    refreshList: async () => {},
    checkOutdated: async () => {},
};

const ActivityContext = createContext<IActivityContext>(initialContext);

const PAGE_LIMIT = 10;

export const ActivityProvider = ({ form, children }: IActivityProps): React.ReactNode => {
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
    const flatActivities = ActivityModel.Model.useModels(activityFilter, [activityFilter]);
    const [page, setPage] = useState(0);
    const [isLastPage, setIsLastPage] = useState(!flatActivities.length);
    const activities = useMemo(
        () => flatActivities.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, PAGE_LIMIT * (page + 1)),
        [flatActivities, page]
    );
    const lastCurrentDateRef = useRef<Date>(
        activities[0] ? new Date(activities[0].created_at.setMinutes(activities[0].created_at.getMinutes() + 1)) : new Date()
    );
    const {
        mutateAsync,
        refresh,
        checkOutdated: originalCheckOutdated,
        countNewRecords,
    } = useGetActivities({ form, limit: PAGE_LIMIT, setPage, isLastPage, setIsLastPage, lastCurrentDateRef });
    const isDelayingCheckOutdated = useRef(false);
    const isFetchingRef = useRef(false);
    const activityListIdRef = useRef(createShortUUID());
    const delayCheckOutdatedTimeoutRef = useRef<NodeJS.Timeout>(null);
    const nextPage = useCallback(async () => {
        if (isFetchingRef.current || isLastPage) {
            return false;
        }

        isFetchingRef.current = true;
        return await new Promise<bool>((resolve) => {
            setTimeout(async () => {
                if (flatActivities.length > PAGE_LIMIT * (page + 1)) {
                    setPage((prev) => prev + 1);
                    isFetchingRef.current = false;
                    resolve(true);
                    return;
                }

                await mutateAsync({
                    page,
                });
                setPage((prev) => prev + 1);
                isFetchingRef.current = false;
                resolve(true);
            }, 500);
        });
    }, [page, setPage, isLastPage, mutateAsync, flatActivities]);
    const refreshList = useCallback(async () => {
        if (isFetchingRef.current) {
            return;
        }

        const curIsDelayingCheckOutdated = isDelayingCheckOutdated.current;
        isDelayingCheckOutdated.current = false;
        const list = document.getElementById(activityListIdRef.current)!;

        list.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        setTimeout(() => {
            if (!delayCheckOutdatedTimeoutRef.current && curIsDelayingCheckOutdated) {
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
    const checkOutdated = useCallback(async () => {
        await originalCheckOutdated(lastCurrentDateRef.current);
    }, [originalCheckOutdated]);

    useEffect(() => {
        if (page) {
            return;
        }

        if (flatActivities.length > 0) {
            nextPage();
            return;
        }

        lastCurrentDateRef.current = new Date();
        setTimeout(() => {
            mutateAsync({
                page: 0,
            });
            setPage(1);
        }, 0);

        return () => {
            setPage(0);
        };
    }, []);

    return (
        <ActivityContext.Provider
            value={{
                isFetchingRef,
                isDelayingCheckOutdated,
                delayCheckOutdatedTimeoutRef,
                checkOutdated,
                activities,
                nextPage,
                refreshList,
                activityListIdRef,
                isLastPage,
                countNewRecords,
            }}
        >
            {children}
        </ActivityContext.Provider>
    );
};

export const useActivity = () => {
    const context = useContext(ActivityContext);
    if (!context) {
        throw new Error("useActivity must be used within an ActivityProvider");
    }
    return context;
};
