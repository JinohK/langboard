import { isAxiosError } from "axios";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TInfiniteQueryOptions, TQueryFunction, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Activity } from "@/core/models";

export interface IGetUserActivitiesForm {
    page: number;
    limit: number;
}

export interface IGetUserActivitiesResponse {
    activities: Activity.Interface[];
}

const useGetUserActivities = (
    params: IGetUserActivitiesForm,
    options?: TInfiniteQueryOptions<IGetUserActivitiesResponse, IGetUserActivitiesForm>
) => {
    const { infiniteQuery } = useQueryMutation();

    const getUserActivities: TQueryFunction<IGetUserActivitiesResponse, IGetUserActivitiesForm> = async ({ pageParam }) => {
        try {
            const res = await api.get(API_ROUTES.ACTIVITIY.USER, {
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

    const result = infiniteQuery<IGetUserActivitiesResponse, IGetUserActivitiesForm>(
        ["get-user-activities"],
        getUserActivities,
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

export default useGetUserActivities;
