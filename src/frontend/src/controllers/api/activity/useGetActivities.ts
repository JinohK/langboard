import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ActivityModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";
import { useCallback, useRef, useState } from "react";

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

export interface IUseGetActivitiesProps {
    form: TGetActivitiesForm;
    limit: number;
    isLastPage: bool;
    setIsLastPage: React.Dispatch<React.SetStateAction<bool>>;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    lastCurrentDateRef: React.RefObject<Date>;
}

export interface IGetAcitvitiesParams {
    page: number;
}

export type TGetActivitiesForm =
    | IGetUserActivitiesForm
    | IGerProjectActivitiesForm
    | IGetCardActivitiesForm
    | IGetProjectWikiActivitiesForm
    | IGetProjectAssigneeActivitiesForm;

const useGetActivities = (
    { form, limit, setPage, lastCurrentDateRef, isLastPage, setIsLastPage }: IUseGetActivitiesProps,
    options?: TMutationOptions
) => {
    const { mutate } = useQueryMutation();
    const [countNewRecords, setCountNewRecords] = useState(0);
    const isFetchingRef = useRef(false);
    const limitRef = useRef(limit);

    let url;
    switch (form.type) {
        case "user":
            url = API_ROUTES.ACTIVITIY.USER;
            break;
        case "project":
            url = format(API_ROUTES.ACTIVITIY.PROJECT, { uid: form.project_uid });
            break;
        case "card":
            url = format(API_ROUTES.ACTIVITIY.CARD, { uid: form.project_uid, card_uid: form.card_uid });
            break;
        case "project_wiki":
            url = format(API_ROUTES.ACTIVITIY.PROJECT_WIKI, { uid: form.project_uid, wiki_uid: form.wiki_uid });
            break;
        case "project_assignee":
            url = format(API_ROUTES.ACTIVITIY.PROJECT_ASSIGNEE, { uid: form.project_uid, assignee_uid: form.assignee_uid });
            break;
        default:
            throw new Error("Invalid activity type");
    }

    const getActivities = useCallback(
        async (params: IGetAcitvitiesParams) => {
            if ((isLastPage && params.page) || isFetchingRef.current) {
                return {};
            }

            isFetchingRef.current = true;

            ++params.page;

            const res = await api.get(url, {
                params: {
                    ...params,
                    refer_time: lastCurrentDateRef.current,
                    limit: limitRef.current,
                },
            });

            if (res.data.references) {
                for (let i = 0; i < res.data.activities.length; ++i) {
                    res.data.activities[i].references = res.data.references;
                }
            }

            ActivityModel.Model.fromObjectArray(res.data.activities, true);

            setIsLastPage(res.data.activities.length < limitRef.current);
            if (res.data.count_new_records) {
                setCountNewRecords(res.data.count_new_records);
            }

            isFetchingRef.current = false;

            return {};
        },
        [isLastPage, countNewRecords, setPage, setIsLastPage, setCountNewRecords]
    );

    const refresh = useCallback(async () => {
        if (isFetchingRef.current || !countNewRecords) {
            return;
        }

        const curLimit = limitRef.current;
        limitRef.current = countNewRecords;
        lastCurrentDateRef.current = new Date();

        await getActivities({
            page: 0,
        });

        limitRef.current = curLimit;
        setPage((prev) => prev + Math.ceil(countNewRecords / limitRef.current));
        setCountNewRecords(0);
    }, [setPage, getActivities, countNewRecords, setCountNewRecords]);

    const checkOutdated = useCallback(
        async (referTime: Date) => {
            if (isFetchingRef.current) {
                return;
            }

            const res = await api.get(url, {
                params: {
                    only_count: true,
                    refer_time: referTime,
                    page: 1,
                    limit: 1,
                },
            });

            if (res.data.count_new_records) {
                setCountNewRecords(res.data.count_new_records);
            }
        },
        [countNewRecords, setCountNewRecords]
    );

    const result = mutate([`get-activities-${url.replace(/\//g, "-")}`], getActivities, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage, countNewRecords, refresh, checkOutdated };
};

export default useGetActivities;
