import { API_ROUTES } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { ProjectCardAttachment } from "@/core/models";
import { format } from "@/core/utils/StringUtils";
import { AxiosProgressEvent } from "axios";

export interface IUploadCardAttachmentForm {
    project_uid: string;
    card_uid: string;
    attachment: File;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export interface IUploadCardAttachmentResponse extends ProjectCardAttachment.IBoard, IModelIdBase {}

const useUploadCardAttachment = (options?: TMutationOptions<IUploadCardAttachmentForm, IUploadCardAttachmentResponse>) => {
    const { mutate } = useQueryMutation();

    const updateCardComment = async (params: IUploadCardAttachmentForm) => {
        const url = format(API_ROUTES.BOARD.CARD.ATTACHMENT.UPLOAD, {
            uid: params.project_uid,
            card_uid: params.card_uid,
        });
        const formData = new FormData();
        formData.append("attachment", params.attachment);
        const res = await api.post(url, formData, {
            onUploadProgress: params.onUploadProgress,
        });

        return res.data;
    };

    const result = mutate(["upload-card-attachment"], updateCardComment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUploadCardAttachment;
