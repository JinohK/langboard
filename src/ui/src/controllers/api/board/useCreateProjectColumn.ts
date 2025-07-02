/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface ICreateProjectColumnForm {
    project_uid: string;
    name: string;
}

const useCreateProjectColumn = (options?: TMutationOptions<ICreateProjectColumnForm>) => {
    const { mutate } = useQueryMutation();

    const createProjectColumn = async (params: ICreateProjectColumnForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.COLUMN.CREATE, {
            uid: params.project_uid,
        });
        const res = await api.post(
            url,
            {
                name: params.name,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["create-project-column"], createProjectColumn, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateProjectColumn;
