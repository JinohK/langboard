"use client";

import { cn } from "@udecode/cn";
import { useMediaState } from "@udecode/plate-media/react";
import { ResizableProvider } from "@udecode/plate-resizable";
import { PlateElement, PlateElementProps, useReadOnly, withHOC } from "@udecode/plate/react";
import { FileUp, LoaderCircle } from "lucide-react";
import { Caption, CaptionTextarea } from "@/components/plate-ui/caption";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useDownloadFile from "@/core/hooks/useDownloadFile";
import { TFileElement } from "@udecode/plate-media";

export const MediaFileElement = withHOC(ResizableProvider, function MediaFileElement(props: PlateElementProps<TFileElement>) {
    const [t] = useTranslation();
    const readOnly = useReadOnly();
    const { name, unsafeUrl } = useMediaState();

    const { download, isDownloading } = useDownloadFile({
        url: unsafeUrl,
        filename: name,
        onError: () => {
            Toast.Add.error(t("errors.Download failed."));
        },
    });

    return (
        <PlateElement className="my-px rounded-sm" {...props}>
            <div
                className={cn(
                    "group relative m-0 flex items-center rounded px-0.5 py-[3px]",
                    isDownloading ? "bg-muted/70" : "cursor-pointer hover:bg-muted"
                )}
                onClick={download}
                contentEditable={false}
                role="button"
            >
                <div className="flex items-center gap-1 p-1">
                    {isDownloading ? <LoaderCircle className="size-5 animate-spin" /> : <FileUp className="size-5" />}
                    <div>{name}</div>
                </div>

                <Caption align="left">
                    <CaptionTextarea className="text-left" readOnly={readOnly} placeholder={t("editor.Write a caption...")} />
                </Caption>
            </div>
            {props.children}
        </PlateElement>
    );
});
