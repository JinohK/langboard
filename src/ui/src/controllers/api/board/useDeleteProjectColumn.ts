/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteProjectColumnForm {
    project_uid: string;
    column_uid: string;
}

const useDeleteProjectColumn = (options?: TMutationOptions<IDeleteProjectColumnForm>) => {
    const { mutate } = useQueryMutation();

    const deleteProjectColumn = async (params: IDeleteProjectColumnForm) => {
        const url = format(API_ROUTES.BOARD.COLUMN.DELETE, {
            uid: params.project_uid,
            column_uid: params.column_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["delete-project-column"], deleteProjectColumn, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteProjectColumn;
