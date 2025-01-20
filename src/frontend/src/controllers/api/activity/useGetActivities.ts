import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ActivityModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";
import { useEffect, useRef, useState } from "react";

type TActivityType = "user" | "project" | "card" | "project_wiki";

interface IBaseGetActivitiesForm<TActivity extends TActivityType> {
    type: TActivity;
}

interface IGetUserActivitiesForm extends IBaseGetActivitiesForm<"user"> {}

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

export type TGetActivitiesForm = IGetUserActivitiesForm | IGerProjectActivitiesForm | IGetCardActivitiesForm | IGetProjectWikiActivitiesForm;

const useGetActivities = (form: TGetActivitiesForm, limit: number = 20, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();
    const [isLastPage, setIsLastPage] = useState(true);
    const [isOutdated, setIsOutdated] = useState(false);
    const lastCurrentDateRef = useRef(new Date());
    const pageRef = useRef(0);

    let url;
    let activityFilter;
    switch (form.type) {
        case "user":
            url = API_ROUTES.ACTIVITIY.USER;
            activityFilter = (model: ActivityModel.TModel) => model.filterable_type === "user";
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
    }

    const getActivities = async () => {
        if (isLastPage && pageRef.current) {
            return { isUpdated: false };
        }

        if (!ActivityModel.Model.getModel(activityFilter)) {
            pageRef.current = 0;
        }

        ++pageRef.current;

        const res = await api.get(url, {
            params: {
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit,
            },
        });

        ActivityModel.Model.fromObjectArray(res.data.activities, true);

        setIsLastPage(res.data.activities.length < limit);
        if (res.data.is_outdated) {
            setIsOutdated(true);
        }

        return {};
    };

    useEffect(() => {
        if (pageRef.current) {
            return;
        }

        lastCurrentDateRef.current = new Date();
        getActivities();

        return () => {
            pageRef.current = 0;
        };
    }, []);

    const result = mutate([`get-activities-${url.replace(/\//g, "-")}`], getActivities, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage, isOutdated };
};

export default useGetActivities;
