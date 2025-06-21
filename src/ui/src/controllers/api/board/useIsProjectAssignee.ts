/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IIsProjectAssigneeForm {
    project_uid: string;
    assignee_uid: string;
}

export interface IIsProjectAssigneeResponse {
    result: bool;
    is_bot_disabled?: bool;
}

const useIsProjectAssignee = (options?: TMutationOptions<IIsProjectAssigneeForm, IIsProjectAssigneeResponse>) => {
    const { mutate } = useQueryMutation();

    const isProjectAssignee = async (params: IIsProjectAssigneeForm) => {
        const url = format(API_ROUTES.BOARD.IS_PROJECT_ASSIGNEE, { uid: params.project_uid, assignee_uid: params.assignee_uid });
        const res = await api.get(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["is-project-assignee"], isProjectAssignee, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useIsProjectAssignee;
