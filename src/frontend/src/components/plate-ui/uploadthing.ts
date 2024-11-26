import { Toast } from "@/components/base";
import { API_URL } from "@/constants";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { AxiosProgressEvent } from "axios";
import * as React from "react";
import { useTranslation } from "react-i18next";

export interface UploadedFile {
    name: string;
    url: string;
}

export interface IUseUploadFile {
    uploadPath?: string;
}

export function useUploadFile({ uploadPath }: IUseUploadFile) {
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
            const result = await api.post(`${API_URL}${uploadPath}`, formData, {
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                    const total = progressEvent.total ?? 0;
                    const progress = (progressEvent.loaded / total) * 100;
                    setProgress(progress);
                },
            });

            // Simulate upload progress
            let progress = 0;

            const simulateProgress = async () => {
                while (progress < 100) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    progress += 2;
                    setProgress(Math.min(progress, 100));
                }
            };

            await simulateProgress();

            const { name, path } = result.data;
            const uploadedFile = {
                name,
                url: `${API_URL}${path}`,
            };

            setUploadedFile(uploadedFile);

            return uploadedFile;
        } catch (error) {
            const { handle } = setupApiErrorHandler({
                [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                    Toast.Add.error(t("editor.errors.upload.unknown"));
                },
                [EHttpStatus.HTTP_400_BAD_REQUEST]: () => {
                    // TODO: Show error message
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
