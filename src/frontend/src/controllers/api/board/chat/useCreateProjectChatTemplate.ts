/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface ICreateProjectChatTemplateForm {
    project_uid: string;
    name: string;
    template: string;
}

const useCreateProjectChatTemplate = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const createProjectChatTemplate = async (params: ICreateProjectChatTemplateForm) => {
        const url = format(API_ROUTES.BOARD.CHAT.TEMPLATE.CREATE, {
            uid: params.project_uid,
        });
        const res = await api.post(
            url,
            {
                name: params.name,
                template: params.template,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["create-project-chat-template"], createProjectChatTemplate, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateProjectChatTemplate;
