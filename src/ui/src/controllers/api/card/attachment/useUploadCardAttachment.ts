/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { AxiosProgressEvent } from "axios";

export interface IUploadCardAttachmentForm {
    project_uid: string;
    card_uid: string;
    attachment: File;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

const useUploadCardAttachment = (options?: TMutationOptions<IUploadCardAttachmentForm>) => {
    const { mutate } = useQueryMutation();

    const updateCardAttachment = async (params: IUploadCardAttachmentForm) => {
        const url = Utils.String.format(Routing.API.BOARD.CARD.ATTACHMENT.UPLOAD, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const formData = new FormData();
        formData.append("attachment", params.attachment);
        const res = await api.post(url, formData, {
            onUploadProgress: params.onUploadProgress,
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["upload-card-attachment"], updateCardAttachment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUploadCardAttachment;
