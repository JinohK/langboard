import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ActivityModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";
import { useCallback, useEffect, useRef, useState } from "react";

type TActivityType = "user" | "project" | "card" | "project_wiki" | "project_assignee";

interface IBaseGetActivitiesForm<TActivity extends TActivityType> {
    type: TActivity;
}

interface IGetUserActivitiesForm extends IBaseGetActivitiesForm<"user"> {
    user_uid: string;
}

interface IGerProjectActivitiesForm extends IBaseGetActivitiesForm<"project"> {
    project_uid: string;
}

interface IGetCardActivitiesForm extends IBaseGetActivitiesForm<"card"> {
    project_uid: string;
    card_uid: string;
}

interface IGetProjectWikiActivitiesForm extends IBaseGetActivitiesForm<"project_wiki"> {
    project_uid: string;
    wiki_uid: string;
}

interface IGetProjectAssigneeActivitiesForm extends IBaseGetActivitiesForm<"project_assignee"> {
    project_uid: string;
    assignee_uid: string;
}

export type TGetActivitiesForm =
    | IGetUserActivitiesForm
    | IGerProjectActivitiesForm
    | IGetCardActivitiesForm
    | IGetProjectWikiActivitiesForm
    | IGetProjectAssigneeActivitiesForm;

const useGetActivities = (form: TGetActivitiesForm, limit: number = 20, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();
    const [isLastPage, setIsLastPage] = useState(true);
    const [countNewRecords, setCountNewRecords] = useState(0);
    const isFetchingRef = useRef(false);
    const limitRef = useRef(limit);
    const lastCurrentDateRef = useRef(new Date());
    const pageRef = useRef(0);

    let url;
    let activityFilter;
    switch (form.type) {
        case "user":
            url = API_ROUTES.ACTIVITIY.USER;
            activityFilter = (model: ActivityModel.TModel) => model.filterable_type === "user" && model.filterable_uid === form.user_uid;
            break;
        case "project":
            url = format(API_ROUTES.ACTIVITIY.PROJECT, { uid: form.project_uid });
            activityFilter = (model: ActivityModel.TModel) => model.filterable_type === "project" && model.filterable_uid === form.project_uid;
            break;
        case "card":
            url = format(API_ROUTES.ACTIVITIY.CARD, { uid: form.project_uid, card_uid: form.card_uid });
            activityFilter = (model: ActivityModel.TModel) =>
                model.filterable_type === "project" &&
                model.filterable_uid === form.project_uid &&
                model.sub_filterable_type === "card" &&
                model.sub_filterable_uid === form.card_uid;
            break;
        case "project_wiki":
            url = format(API_ROUTES.ACTIVITIY.PROJECT_WIKI, { uid: form.project_uid, wiki_uid: form.wiki_uid });
            activityFilter = (model: ActivityModel.TModel) =>
                model.filterable_type === "project" &&
                model.filterable_uid === form.project_uid &&
                model.sub_filterable_type === "project_wiki" &&
                model.sub_filterable_uid === form.wiki_uid;
            break;
        case "project_assignee":
            url = format(API_ROUTES.ACTIVITIY.PROJECT_ASSIGNEE, { uid: form.project_uid, assignee_uid: form.assignee_uid });
            activityFilter = (model: ActivityModel.TModel) => model.filterable_type === "user" && model.filterable_uid === form.assignee_uid;
            break;
    }

    const getActivities = useCallback(async () => {
        if ((isLastPage && pageRef.current) || isFetchingRef.current) {
            return {};
        }

        isFetchingRef.current = true;

        if (!ActivityModel.Model.getModel(activityFilter)) {
            pageRef.current = 0;
        }

        ++pageRef.current;

        const res = await api.get(url, {
            params: {
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit: limitRef.current,
            },
        });

        if (res.data.references) {
            for (let i = 0; i < res.data.activities.length; ++i) {
                res.data.activities[i].references = res.data.references;
            }
        }

        ActivityModel.Model.fromObjectArray(res.data.activities, true);

        setIsLastPage(res.data.activities.length < limit);
        if (res.data.count_new_records) {
            setCountNewRecords(res.data.count_new_records);
        }

        isFetchingRef.current = false;

        return {};
    }, [isLastPage, countNewRecords]);

    const refresh = useCallback(async () => {
        if (isFetchingRef.current) {
            return;
        }

        const curLimit = limitRef.current;
        const curPage = pageRef.current;

        lastCurrentDateRef.current = new Date();
        limitRef.current = countNewRecords;
        pageRef.current = 0;
        await getActivities();

        limitRef.current = curLimit;
        pageRef.current = curPage + Math.ceil(countNewRecords / curLimit);
        setCountNewRecords(0);
    }, [countNewRecords]);

    const checkOutdated = useCallback(async () => {
        if (isFetchingRef.current) {
            return;
        }

        const res = await api.get(url, {
            params: {
                only_count: true,
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit: limitRef.current,
            },
        });

        if (res.data.count_new_records) {
            setCountNewRecords(res.data.count_new_records);
        }
    }, [countNewRecords]);

    useEffect(() => {
        if (pageRef.current) {
            return;
        }

        lastCurrentDateRef.current = new Date();
        setTimeout(() => {
            getActivities();
        }, 0);

        return () => {
            pageRef.current = 0;
        };
    }, []);

    const result = mutate([`get-activities-${url.replace(/\//g, "-")}`], getActivities, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage, countNewRecords, refresh, checkOutdated };
};

export default useGetActivities;
