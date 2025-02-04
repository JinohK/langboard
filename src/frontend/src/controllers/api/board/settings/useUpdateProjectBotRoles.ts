import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateProjectBotRolesForm {
    project_uid: string;
    roles: Project.TRoleActions[];
}

const useUpdateProjectBotRoles = (botUID: string, options?: TMutationOptions<IUpdateProjectBotRolesForm>) => {
    const { mutate } = useQueryMutation();

    const updateProjectBotRoles = async (params: IUpdateProjectBotRolesForm) => {
        const url = format(API_ROUTES.BOARD.SETTINGS.UPDATE_BOT_ROLES, {
            uid: params.project_uid,
            bot_uid: botUID,
        });
        const res = await api.put(url, {
            ...params,
        });

        return res.data;
    };

    const result = mutate(["update-project-bot-roles"], updateProjectBotRoles, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProjectBotRoles;
