import { isAxiosError } from "axios";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TInfiniteQueryOptions, TQueryFunction, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Activity } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetCardActivitiesForm {
    project_uid: string;
    card_uid: string;
    page: number;
    limit: number;
}

export interface IGetCardActivitiesResponse {
    activities: Activity.Interface[];
}

const useGetCardActivities = (
    params: IGetCardActivitiesForm,
    options?: TInfiniteQueryOptions<IGetCardActivitiesResponse, IGetCardActivitiesForm>
) => {
    const { infiniteQuery } = useQueryMutation();

    const getCardActivities: TQueryFunction<IGetCardActivitiesResponse, IGetCardActivitiesForm> = async ({ pageParam }) => {
        try {
            const url = format(API_ROUTES.ACTIVITIY.CARD, { uid: params.project_uid, card_uid: params.card_uid });
            const res = await api.get(url, {
                params: {
                    page: pageParam.page,
                    limit: pageParam.limit,
                },
            });

            return res.data;
        } catch (e) {
            if (!isAxiosError(e)) {
                throw e;
            }

            if (e.status === EHttpStatus.HTTP_404_NOT_FOUND) {
                return undefined;
            }
        }
    };

    const nextPageParam = options?.getNextPageParam;
    delete options?.getNextPageParam;
    delete options?.initialPageParam;

    const result = infiniteQuery<IGetCardActivitiesResponse, IGetCardActivitiesForm>(
        ["get-card-activities"],
        getCardActivities,
        (lastPage, allPages, lastPageParam, allPageParams) => {
            if (nextPageParam) {
                return nextPageParam(lastPage, allPages, lastPageParam, allPageParams);
            }

            return lastPageParam;
        },
        params,
        {
            ...options,
            retry: false,
            staleTime: Infinity,
        }
    );

    return result;
};

export default useGetCardActivities;
