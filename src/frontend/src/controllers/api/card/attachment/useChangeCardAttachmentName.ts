import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardAttachmentNameForm {
    project_uid: string;
    card_uid: string;
    attachment_uid: string;
    attachment_name: string;
}

export interface IChangeCardAttachmentNameResponse {}

const useChangeCardAttachmentName = (options?: TMutationOptions<IChangeCardAttachmentNameForm, IChangeCardAttachmentNameResponse>) => {
    const { mutate } = useQueryMutation();

    const changeCardAttachmentName = async (params: IChangeCardAttachmentNameForm) => {
        const url = format(API_ROUTES.BOARD.CARD.ATTACHMENT.CHANGE_NAME, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            attachment_uid: params.attachment_uid,
        });
        const res = await api.put(url, {
            attachment_name: params.attachment_name,
        });

        return res.data;
    };

    const result = mutate(["change-card-attachment-name"], changeCardAttachmentName, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardAttachmentName;
