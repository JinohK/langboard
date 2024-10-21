import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TInfiniteQueryOptions, TQueryFunction, useQueryMutation } from "@/core/helpers/QueryMutation";
import { isAxiosError } from "axios";

interface IGetProjectsForm {
    listType: "starred" | "recent" | "unstarred";
    page: number;
    limit: number;
}

export interface IProject {
    uid: string;
    starred: boolean;
    title: string;
    project_type: string;
    group_names: string[];
}

export interface IGetProjectsResponse {
    projects: IProject[];
    total: number;
}

const useGetProjects = (params: IGetProjectsForm, options?: TInfiniteQueryOptions<IGetProjectsResponse, IGetProjectsForm>) => {
    const { infiniteQuery } = useQueryMutation();

    const getProjects: TQueryFunction<IGetProjectsResponse, IGetProjectsForm> = async ({ pageParam }) => {
        try {
            const res = await api.get(`${API_ROUTES.DASHBOARD_PROJECTS}/${pageParam.listType}`, {
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

    const result = infiniteQuery<IGetProjectsResponse, IGetProjectsForm>(
        [`get-projects-${params.listType}`],
        getProjects,
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

export default useGetProjects;
