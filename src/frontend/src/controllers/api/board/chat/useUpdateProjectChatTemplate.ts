import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateProjectChatTemplateForm {
    project_uid: string;
    template_uid: string;
    name?: string;
    template?: string;
}

const useUpdateProjectChatTemplate = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const updateProjectChatTemplate = async (params: IUpdateProjectChatTemplateForm) => {
        const url = format(API_ROUTES.BOARD.CHAT.TEMPLATE.UPDATE, {
            uid: params.project_uid,
            template_uid: params.template_uid,
        });
        const res = await api.put(url, {
            name: params.name,
            template: params.template,
        });

        return res.data;
    };

    const result = mutate(["update-project-chat-template"], updateProjectChatTemplate, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProjectChatTemplate;
