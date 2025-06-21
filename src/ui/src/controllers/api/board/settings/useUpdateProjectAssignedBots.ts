/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateProjectAssignedBotsForm {
    uid: string;
    assigned_bots: string[];
}

const useUpdateProjectAssignedBots = (options?: TMutationOptions<IUpdateProjectAssignedBotsForm>) => {
    const { mutate } = useQueryMutation();

    const updateProjectAssignedBots = async (params: IUpdateProjectAssignedBotsForm) => {
        const url = format(API_ROUTES.BOARD.SETTINGS.UPDATE_ASSIGNED_BOTS, {
            uid: params.uid,
        });
        const res = await api.put(
            url,
            {
                ...params,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["update-project-assigned-bots"], updateProjectAssignedBots, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProjectAssignedBots;
