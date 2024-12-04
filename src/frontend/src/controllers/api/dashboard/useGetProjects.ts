import { isAxiosError } from "axios";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TInfiniteQueryOptions, TQueryFunction, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";

export interface IGetProjectsForm {
    listType: "all" | "starred" | "recent" | "unstarred";
    page: number;
    limit: number;
}

export interface IDashboardProject extends Project.Interface {
    starred: bool;
    columns: {
        name: string;
        count: number;
    }[];
}

export interface IGetProjectsResponse {
    projects: IDashboardProject[];
}

const useGetProjects = (params: IGetProjectsForm, options?: TInfiniteQueryOptions<IGetProjectsResponse, IGetProjectsForm>) => {
    const { infiniteQuery } = useQueryMutation();

    const getProjects: TQueryFunction<IGetProjectsResponse, IGetProjectsForm> = async ({ pageParam }) => {
        try {
            const res = await api.get(`${API_ROUTES.DASHBOARD.PROJECTS}/${pageParam.listType}`, {
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
        [`get-dashboard-projects-${params.listType}`],
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
