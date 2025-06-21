/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IDeleteCardAttachmentForm {
    project_uid: string;
    card_uid: string;
    attachment_uid: string;
}

const useDeleteCardAttachment = (options?: TMutationOptions<IDeleteCardAttachmentForm>) => {
    const { mutate } = useQueryMutation();

    const deleteCardAttachment = async (params: IDeleteCardAttachmentForm) => {
        const url = format(API_ROUTES.BOARD.CARD.ATTACHMENT.DELETE, {
            uid: params.project_uid,
            card_uid: params.card_uid,
            attachment_uid: params.attachment_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });
        return res.data;
    };

    const result = mutate(["delete-card-attachment"], deleteCardAttachment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteCardAttachment;
