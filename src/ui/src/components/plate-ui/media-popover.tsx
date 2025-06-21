"use client";

import React, { useEffect } from "react";
import type { WithRequiredKey } from "@udecode/plate";
import { FloatingMedia as FloatingMediaPrimitive, FloatingMediaStore, useFloatingMediaValue, useImagePreviewValue } from "@udecode/plate-media/react";
import { useEditorRef, useEditorSelector, useElement, useReadOnly, useRemoveNodeButton, useSelected } from "@udecode/plate/react";
import { Link, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariants, Popover, Separator } from "@/components/base";
import { CaptionButton } from "@/components/plate-ui/caption";
import { InputVariants } from "@/components/base/Input";

export interface MediaPopoverProps {
    children: React.ReactNode;
    plugin: WithRequiredKey;
}

export function MediaPopover({ children, plugin }: MediaPopoverProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const readOnly = useReadOnly();
    const selected = useSelected();

    const selectionCollapsed = useEditorSelector((editor) => !editor.api.isExpanded(), []);
    const isImagePreviewOpen = useImagePreviewValue("isOpen", editor.id);
    const isOpen = !readOnly && selected && selectionCollapsed && !isImagePreviewOpen;
    const isEditing = useFloatingMediaValue("isEditing");

    useEffect(() => {
        if (!isOpen && isEditing) {
            FloatingMediaStore.set("isEditing", false);
        }
    }, [isOpen]);

    const element = useElement();
    const { props: buttonProps } = useRemoveNodeButton({ element });

    if (readOnly) return <>{children}</>;

    return (
        <Popover.Root open={isOpen} modal={false}>
            <Popover.Anchor>{children}</Popover.Anchor>

            <Popover.Content className="w-auto p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
                {isEditing ? (
                    <div className="flex w-[330px] flex-col">
                        <div className="flex items-center">
                            <div className="flex items-center pl-2 pr-1 text-muted-foreground">
                                <Link className="size-4" />
                            </div>

                            <FloatingMediaPrimitive.UrlInput
                                className={InputVariants({ h: "sm", variant: "ghost" })}
                                placeholder={t("editor.Paste the embed link...")}
                                options={{ plugin }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="box-content flex items-center">
                        <FloatingMediaPrimitive.EditButton className={ButtonVariants({ size: "sm", variant: "ghost" })}>
                            {t("editor.Edit link")}
                        </FloatingMediaPrimitive.EditButton>

                        <CaptionButton variant="ghost">{t("editor.Caption")}</CaptionButton>

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        <Button size="icon" variant="ghost" {...buttonProps}>
                            <Trash2Icon className="size-4" />
                        </Button>
                    </div>
                )}
            </Popover.Content>
        </Popover.Root>
    );
}
