import { API_URL } from "@/constants";
import { api } from "@/core/helpers/Api";
import { useCallback, useRef, useState } from "react";

export interface IUseDownloadFileProps {
    url: string;
    filename?: string;
    onError?: () => void;
    onFinally?: () => void;
}

const useDownloadFile = ({ url, filename, onError, onFinally }: IUseDownloadFileProps, deps?: unknown[]) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const isDownloadingRef = useRef(isDownloading);
    const download = useCallback(() => {
        if (isDownloadingRef.current) {
            return;
        }

        setIsDownloading(true);
        isDownloadingRef.current = true;

        api.get(url.replace(API_URL, ""), { responseType: "blob" })
            .then((response) => {
                const blob = response.data;
                const url = URL.createObjectURL(blob);

                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = filename ?? url.split("/").pop()!;
                anchor.click();
                anchor.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => {
                onError?.();
            })
            .finally(() => {
                onFinally?.();
                setIsDownloading(false);
                isDownloadingRef.current = false;
            });
    }, [url, filename, onError, onFinally, ...(deps ?? [])]);

    return { download, isDownloading };
};

export default useDownloadFile;
