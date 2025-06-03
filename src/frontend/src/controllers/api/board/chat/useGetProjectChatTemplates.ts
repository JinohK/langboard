import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ChatTemplateModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectChatTemplatesForm {
    project_uid: string;
}

const useGetProjectChatTemplates = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getProjectChatTemplates = async (params: IGetProjectChatTemplatesForm) => {
        const url = format(API_ROUTES.BOARD.CHAT.TEMPLATE.GET_LIST, {
            uid: params.project_uid,
        });
        const res = await api.get(url);

        ChatTemplateModel.Model.fromObjectArray(res.data.templates, true);

        return {};
    };

    const result = mutate(["get-project-chat-templates"], getProjectChatTemplates, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetProjectChatTemplates;
