"use client";

import { cn, withRef } from "@udecode/cn";
import { withHOC } from "@udecode/plate/react";
import { useMediaState } from "@udecode/plate-media/react";
import { ResizableProvider } from "@udecode/plate-resizable";
import { FileUp, LoaderCircle } from "lucide-react";
import { useReadOnly } from "slate-react";
import { Caption, CaptionTextarea } from "@/components/plate-ui/caption";
import { PlateElement } from "@/components/plate-ui/plate-element";
import { useTranslation } from "react-i18next";
import { Toast } from "@/components/base";
import useDownloadFile from "@/core/hooks/useDownloadFile";

export const MediaFileElement = withHOC(
    ResizableProvider,
    withRef<typeof PlateElement>(({ children, className, nodeProps, ...props }, ref) => {
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
            <PlateElement ref={ref} className={cn("relative my-px rounded-sm", className)} {...props}>
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

                        {/* TODO: add size */}
                        {/* <div className="text-muted-foreground">{element.size}</div> */}
                    </div>

                    <Caption align="left">
                        <CaptionTextarea className="text-left" readOnly={readOnly} placeholder={t("editor.Write a caption...")} />
                    </Caption>
                </div>
                {children}
            </PlateElement>
        );
    })
);
