import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IChangeCardAttachmentOrderForm {
    project_uid: string;
    card_uid: string;
    attachment_uid: string;
    order: number;
}

export interface IChangeCardAttachmentOrderResponse extends IModelIdBase {}

const useChangeCardAttachmentOrder = (options?: TMutationOptions<IChangeCardAttachmentOrderForm, IChangeCardAttachmentOrderResponse>) => {
    const { mutate } = useQueryMutation();

    const changeCardAttachmentOrder = async (params: IChangeCardAttachmentOrderForm) => {
        const url = format(API_ROUTES.BOARD.CARD.ATTACHMENT.CHANGE_ORDER, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            attachment_uid: params.attachment_uid,
        });
        const res = await api.put(url, {
            order: params.order,
        });

        return res.data;
    };

    const result = mutate(["change-card-attachment-order"], changeCardAttachmentOrder, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeCardAttachmentOrder;
