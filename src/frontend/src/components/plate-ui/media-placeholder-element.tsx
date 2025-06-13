/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TPlaceholderElement } from "@udecode/plate-media";
import { cn } from "@udecode/cn";
import { PlateElement, PlateElementProps, useEditorPlugin, withHOC } from "@udecode/plate/react";
import {
    AudioPlugin,
    FilePlugin,
    ImagePlugin,
    PlaceholderPlugin,
    PlaceholderProvider,
    VideoPlugin,
    updateUploadHistory,
} from "@udecode/plate-media/react";
import { AudioLines, FileUp, Film, ImageIcon, Loader2Icon } from "lucide-react";
import { useFilePicker } from "use-file-picker";
import { useUploadFile } from "@/components/plate-ui/uploadthing";
import { useTranslation } from "react-i18next";
import TypeUtils from "@/core/utils/TypeUtils";
import { formatBytes } from "@/core/utils/StringUtils";

const CONTENT: Record<
    string,
    {
        accept: string[];
        content: ReactNode;
        icon: ReactNode;
    }
> = {
    [AudioPlugin.key]: {
        accept: ["audio/*"],
        content: "editor.Add an audio file",
        icon: <AudioLines />,
    },
    [FilePlugin.key]: {
        accept: ["*"],
        content: "editor.Add a file",
        icon: <FileUp />,
    },
    [ImagePlugin.key]: {
        accept: ["image/*"],
        content: "editor.Add an image",
        icon: <ImageIcon />,
    },
    [VideoPlugin.key]: {
        accept: ["video/*"],
        content: "editor.Add a video",
        icon: <Film />,
    },
};

export const MediaPlaceholderElement = withHOC(PlaceholderProvider, function MediaPlaceholderElement(props: PlateElementProps<TPlaceholderElement>) {
    const [t] = useTranslation();
    const { editor, element } = props;
    const { api } = useEditorPlugin(PlaceholderPlugin);
    const { isUploading, progress, uploadFile, uploadedFile, uploadingFile } = useUploadFile();
    const loading = isUploading && uploadingFile;
    const currentContent = CONTENT[element.mediaType];
    const isImage = element.mediaType === ImagePlugin.key;
    const imageRef = useRef<HTMLImageElement>(null);

    const { openFilePicker } = useFilePicker({
        accept: currentContent.accept,
        multiple: true,
        onFilesSelected: ({ plainFiles: updatedFiles }) => {
            const firstFile = updatedFiles[0];
            const restFiles = updatedFiles.slice(1);

            replaceCurrentPlaceholder(firstFile);

            if (restFiles.length > 0) {
                editor.getTransforms(PlaceholderPlugin).insert.media(restFiles);
            }
        },
    });

    const replaceCurrentPlaceholder = React.useCallback(
        (file: File) => {
            void uploadFile(file);
            api.placeholder.addUploadingFile(element.id as string, file);
        },
        [api.placeholder, element.id, uploadFile]
    );

    useEffect(() => {
        if (!uploadedFile) return;

        const path = editor.api.findPath(element);

        editor.tf.withoutSaving(() => {
            editor.tf.removeNodes({ at: path });

            const node = {
                children: [{ text: "" }],
                initialHeight: imageRef.current?.height,
                initialWidth: imageRef.current?.width,
                isUpload: true,
                name: element.mediaType === FilePlugin.key ? uploadedFile.name : "",
                placeholderId: element.id as string,
                type: element.mediaType!,
                url: uploadedFile.url,
            };

            editor.history.undos.reverse().forEach((batch) => {
                if (batch.operations.some((operation) => operation.type === "insert_node" && (operation.node as any).id === node.placeholderId)) {
                    (batch as any)[PlaceholderPlugin.key] = true;
                }
            });

            editor.tf.insertNodes(node, { at: path });

            updateUploadHistory(editor, node);
        });

        api.placeholder.removeUploadingFile(element.id as string);
    }, [uploadedFile, element.id]);

    // React dev mode will call useEffect twice
    const isReplaced = useRef(false);
    /** Paste and drop */
    useEffect(() => {
        if (isReplaced.current) return;

        isReplaced.current = true;
        const currentFiles = api.placeholder.getUploadingFile(element.id as string);

        if (!currentFiles) return;

        replaceCurrentPlaceholder(currentFiles);
    }, [isReplaced]);

    return (
        <PlateElement className="my-1" {...props}>
            {(!loading || !isImage) && (
                <div
                    className={cn("flex cursor-pointer select-none items-center rounded-sm bg-muted p-3 pr-9 hover:bg-primary/10")}
                    onClick={() => !loading && openFilePicker()}
                    contentEditable={false}
                >
                    <div className="relative mr-3 flex text-muted-foreground/80 [&_svg]:size-6">{currentContent.icon}</div>
                    <div className="whitespace-nowrap text-sm text-muted-foreground">
                        <div>
                            {loading
                                ? uploadingFile?.name
                                : TypeUtils.isString(currentContent.content)
                                  ? t(currentContent.content)
                                  : currentContent.content}
                        </div>

                        {loading && !isImage && (
                            <div className="mt-1 flex items-center gap-1.5">
                                <div>{formatBytes(uploadingFile?.size ?? 0)}</div>
                                <div>–</div>
                                <div className="flex items-center">
                                    <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                                    {progress ?? 0}%
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isImage && loading && <ImageProgress file={uploadingFile} imageRef={imageRef} progress={progress} />}

            {props.children}
        </PlateElement>
    );
});

export function ImageProgress({
    className,
    file,
    imageRef,
    progress = 0,
}: {
    file: File;
    className?: string;
    imageRef?: React.Ref<HTMLImageElement>;
    progress?: number;
}) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setObjectUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    if (!objectUrl) {
        return null;
    }

    return (
        <div className={cn("relative", className)} contentEditable={false}>
            <img ref={imageRef} className="h-auto w-full rounded-sm object-cover" alt={file.name} src={objectUrl} />
            {progress < 100 && (
                <div className="absolute bottom-1 right-1 flex items-center space-x-2 rounded-full bg-black/50 px-1 py-0.5">
                    <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs font-medium text-white">{Math.round(progress)}%</span>
                </div>
            )}
        </div>
    );
}
