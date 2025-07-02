/* eslint-disable @typescript-eslint/no-explicit-any */
import { SOCKET_URL } from "@/constants";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";
import { AxiosProgressEvent } from "axios";

export interface IUploadProjectChatAttachmentForm {
    project_uid: string;
    attachment: File;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    abortController?: AbortController;
}

export interface IUploadProjectChatAttachmentResponse {
    file_path: string;
}

const useUploadProjectChatAttachment = (options?: TMutationOptions<IUploadProjectChatAttachmentForm, IUploadProjectChatAttachmentResponse>) => {
    const { mutate } = useQueryMutation();

    const updateProjectChatComment = async (params: IUploadProjectChatAttachmentForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.CHAT.UPLOAD, {
            uid: params.project_uid,
        });
        const formData = new FormData();
        formData.append("attachment", params.attachment);
        const res = await api.post(url, formData, {
            baseURL: SOCKET_URL,
            onUploadProgress: params.onUploadProgress,
            signal: params.abortController?.signal,
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["upload-project-chat-attachment"], updateProjectChatComment, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUploadProjectChatAttachment;
