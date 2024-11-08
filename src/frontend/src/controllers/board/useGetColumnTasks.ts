import { isAxiosError } from "axios";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import { TInfiniteQueryOptions, TQueryFunction, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Task, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetColumnTasksForm {
    project_uid: string;
    column_uid: string;
    page: number;
    limit: number;
}

export interface IBoardTask extends Omit<Task.Interface, "column_id"> {
    column_uid: string;
    comment_count: number;
    members: User.Interface[];
}

export interface IGetColumnTasksResponse {
    tasks: IBoardTask[];
}

const useGetColumnTasks = (params: IGetColumnTasksForm, options?: TInfiniteQueryOptions<IGetColumnTasksResponse, IGetColumnTasksForm>) => {
    const { infiniteQuery } = useQueryMutation();

    const getColumnTasks: TQueryFunction<IGetColumnTasksResponse, IGetColumnTasksForm> = async ({ pageParam }) => {
        try {
            const url = format(API_ROUTES.BOARD.GET_COLUMN_TASKS, {
                uid: params.project_uid,
                column_uid: params.column_uid,
            });
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

    const result = infiniteQuery<IGetColumnTasksResponse, IGetColumnTasksForm>(
        [`get-column-tasks-${params.project_uid}-${params.column_uid}`],
        getColumnTasks,
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

export default useGetColumnTasks;
