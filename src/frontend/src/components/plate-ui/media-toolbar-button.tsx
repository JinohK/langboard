/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { insertNodes, isUrl } from "@udecode/plate-common";
import { useEditorRef } from "@udecode/plate-common/react";
import { AudioPlugin, FilePlugin, ImagePlugin, VideoPlugin } from "@udecode/plate-media/react";
import { AudioLinesIcon, FileUpIcon, FilmIcon, ImageIcon, LinkIcon } from "lucide-react";
import { useFilePicker } from "use-file-picker";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/plate-ui/alert-dialog";
import { ToolbarSplitButton, ToolbarSplitButtonPrimary, ToolbarSplitButtonSecondary } from "@/components/plate-ui/toolbar";
import { DropdownMenu, Floating, Toast } from "@/components/base";
import { useTranslation } from "react-i18next";

const MEDIA_CONFIG: Record<
    string,
    {
        accept: string[];
        icon: React.ReactNode;
        title: string;
        tooltip: string;
    }
> = {
    [AudioPlugin.key]: {
        accept: ["audio/*"],
        icon: <AudioLinesIcon className="size-4" />,
        title: "editor.Insert Audio",
        tooltip: "editor.Audio",
    },
    [FilePlugin.key]: {
        accept: ["*"],
        icon: <FileUpIcon className="size-4" />,
        title: "editor.Insert File",
        tooltip: "editor.File",
    },
    [ImagePlugin.key]: {
        accept: ["image/*"],
        icon: <ImageIcon className="size-4" />,
        title: "editor.Insert Image",
        tooltip: "editor.Image",
    },
    [VideoPlugin.key]: {
        accept: ["video/*"],
        icon: <FilmIcon className="size-4" />,
        title: "editor.Insert Video",
        tooltip: "editor.Video",
    },
};

export function MediaToolbarButton({ children, nodeType, ...props }: DropdownMenuProps & { nodeType: string }) {
    const [t] = useTranslation();
    const currentConfig = MEDIA_CONFIG[nodeType];

    const editor = useEditorRef();
    const openState = DropdownMenu.useOpenState();
    const [dialogOpen, setDialogOpen] = useState(false);

    const { openFilePicker } = useFilePicker({
        accept: currentConfig.accept,
        multiple: true,
        onFilesSelected: ({ plainFiles: updatedFiles }) => {
            (editor as any).tf.insert.media(updatedFiles);
        },
    });

    return (
        <>
            <ToolbarSplitButton
                onClick={() => {
                    openFilePicker();
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        openState.onOpenChange(true);
                    }
                }}
                pressed={openState.open}
                tooltip={t(currentConfig.tooltip)}
            >
                <ToolbarSplitButtonPrimary>{currentConfig.icon}</ToolbarSplitButtonPrimary>

                <DropdownMenu.Root {...openState} modal={false} {...props}>
                    <DropdownMenu.Trigger asChild>
                        <ToolbarSplitButtonSecondary />
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Content onClick={(e) => e.stopPropagation()} align="start" alignOffset={-32}>
                        <DropdownMenu.Group>
                            <DropdownMenu.Item onSelect={() => openFilePicker()}>
                                {currentConfig.icon}
                                {t("editor.Upload from computer")}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onSelect={() => setDialogOpen(true)}>
                                <LinkIcon className="size-4" />
                                {t("editor.Insert via URL")}
                            </DropdownMenu.Item>
                        </DropdownMenu.Group>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </ToolbarSplitButton>

            <AlertDialog
                open={dialogOpen}
                onOpenChange={(value) => {
                    setDialogOpen(value);
                }}
            >
                <AlertDialogContent className="gap-6">
                    <MediaUrlDialogContent currentConfig={currentConfig} nodeType={nodeType} isOpened={dialogOpen} setOpen={setDialogOpen} />
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function MediaUrlDialogContent({
    currentConfig,
    nodeType,
    isOpened,
    setOpen,
}: {
    currentConfig: (typeof MEDIA_CONFIG)[string];
    nodeType: string;
    isOpened: bool;
    setOpen: (value: bool) => void;
}) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const [url, setUrl] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const embedMedia = useCallback(() => {
        if (!isUrl(url)) return Toast.Add.error(t("editor.errors.invalid.url"));

        setOpen(false);
        insertNodes(editor, {
            children: [{ text: "" }],
            name: nodeType === FilePlugin.key ? url.split("/").pop() : undefined,
            type: nodeType,
            url,
        });
    }, [url, editor, nodeType, setOpen]);

    useEffect(() => {
        if (isOpened && inputRef.current) {
            setTimeout(() => {
                inputRef.current!.focus();
            }, 0);
        }
    }, [isOpened]);

    return (
        <>
            <AlertDialogHeader>
                <AlertDialogTitle>{t(currentConfig.title)}</AlertDialogTitle>
            </AlertDialogHeader>

            <AlertDialogDescription asChild>
                <div className="group relative w-full text-sm text-muted-foreground">
                    <Floating.LabelInput
                        id="url"
                        className="w-full"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") embedMedia();
                        }}
                        label={t("editor.URL")}
                        placeholder=""
                        type="url"
                        ref={inputRef}
                    />
                </div>
            </AlertDialogDescription>

            <AlertDialogFooter>
                <AlertDialogCancel>{t("editor.Cancel")}</AlertDialogCancel>
                <AlertDialogAction
                    onClick={(e) => {
                        e.preventDefault();
                        embedMedia();
                    }}
                >
                    {t("editor.Accept")}
                </AlertDialogAction>
            </AlertDialogFooter>
        </>
    );
}
