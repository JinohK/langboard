"use client";

import React, { useEffect } from "react";
import { type WithRequiredKey, isSelectionExpanded } from "@udecode/plate-common";
import { useEditorSelector, useElement, useRemoveNodeButton } from "@udecode/plate-common/react";
import { FloatingMedia as FloatingMediaPrimitive, floatingMediaActions, useFloatingMediaSelectors } from "@udecode/plate-media/react";
import { Link, Trash2Icon } from "lucide-react";
import { useReadOnly, useSelected } from "slate-react";
import { CaptionButton } from "./caption";
import { Button, ButtonVariants, Popover, Separator } from "@/components/base";
import { InputVariants } from "@/components/base/Input";
import { useTranslation } from "react-i18next";

export interface MediaPopoverProps {
    children: React.ReactNode;
    plugin: WithRequiredKey;
}

export function MediaPopover({ children, plugin }: MediaPopoverProps) {
    const [t] = useTranslation();
    const readOnly = useReadOnly();
    const selected = useSelected();

    const selectionCollapsed = useEditorSelector((editor) => !isSelectionExpanded(editor), []);
    const isOpen = !readOnly && selected && selectionCollapsed;
    const isEditing = useFloatingMediaSelectors().isEditing();

    useEffect(() => {
        if (!isOpen && isEditing) {
            floatingMediaActions.isEditing(false);
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

                        <CaptionButton variant="ghost" size="sm">
                            {t("editor.Caption")}
                        </CaptionButton>

                        <Separator orientation="vertical" className="mx-1 h-6" />

                        <Button size="icon-sm" variant="ghost" {...buttonProps}>
                            <Trash2Icon className="size-4" />
                        </Button>
                    </div>
                )}
            </Popover.Content>
        </Popover.Root>
    );
}
