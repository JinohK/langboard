import { Toast } from "@/components/base";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import { AxiosProgressEvent } from "axios";
import * as React from "react";
import { useTranslation } from "react-i18next";

export interface UploadedFile {
    name: string;
    url: string;
}

export interface IUseUploadFile {
    uploadPath?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uploadedCallback?: (respones: any) => void;
}

export function useUploadFile({ uploadPath, uploadedCallback }: IUseUploadFile) {
    const [t] = useTranslation();
    const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
    const [uploadingFile, setUploadingFile] = React.useState<File>();
    const [progress, setProgress] = React.useState<number>(0);
    const [isUploading, setIsUploading] = React.useState(false);

    if (uploadPath) {
        if (!uploadPath.startsWith("/")) {
            uploadPath = `/${uploadPath}`;
        }
    }

    async function uploadThing(file: File) {
        if (!uploadPath) {
            return;
        }

        setIsUploading(true);
        setUploadingFile(file);

        const formData = new FormData();
        formData.append("attachment", file);

        try {
            const uploadURL = convertServerFileURL(uploadPath);
            const result = await api.post(uploadURL, formData, {
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    const total = progressEvent.total ?? 0;
                    const progress = (progressEvent.loaded / total) * 100;
                    setProgress(progress);
                },
            });

            const { name, url } = result.data;
            const uploadedFile = {
                name,
                url: convertServerFileURL(url as string),
            };

            setUploadedFile(uploadedFile);
            uploadedCallback?.(result.data);

            return uploadedFile;
        } catch (error) {
            // TODO: Show error message
            const { handle } = setupApiErrorHandler({
                [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                    Toast.Add.error(t("editor.errors.upload.unknown"));
                },
                [EHttpStatus.HTTP_400_BAD_REQUEST]: () => {
                    Toast.Add.error(t("editor.errors.upload.unknown"));
                },
                [EHttpStatus.HTTP_500_INTERNAL_SERVER_ERROR]: () => {
                    Toast.Add.error(t("editor.errors.upload.unknown"));
                },
            });

            handle(error);
            throw error;
        } finally {
            setProgress(0);
            setIsUploading(false);
            setUploadingFile(undefined);
        }
    }

    return {
        isUploading,
        progress,
        uploadFile: uploadThing,
        uploadedFile,
        uploadingFile,
    };
}
