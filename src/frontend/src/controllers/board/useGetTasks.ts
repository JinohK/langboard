import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectColumn, Task, User } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetTasksForm {
    project_uid: string;
}

export interface IBoardTask extends Task.Interface {
    comment_count: number;
    members: User.Interface[];
    relationships: {
        parents: string[];
        children: string[];
    };
}

export interface IGetTasksResponse {
    tasks: IBoardTask[];
    columns: ProjectColumn.Interface[];
}

const useGetTasks = (params: IGetTasksForm, options?: TQueryOptions<IGetTasksForm, IGetTasksResponse>) => {
    const { query } = useQueryMutation();

    const isProjectAvailable = async () => {
        const url = format(API_ROUTES.BOARD.GET_TASKS, { uid: params.project_uid });
        const res = await api.get(url);

        return res.data;
    };

    const result = query([`get-tasks-${params.project_uid}`], isProjectAvailable, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });

    return result;
};

export default useGetTasks;
