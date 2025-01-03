/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { SubscriptPlugin, SuperscriptPlugin } from "@udecode/plate-basic-marks/react";
import { collapseSelection } from "@udecode/plate-common";
import { focusEditor, useEditorRef } from "@udecode/plate-common/react";
import { KbdPlugin } from "@udecode/plate-kbd/react";
import { KeyboardIcon, MoreHorizontalIcon, RadicalIcon, SubscriptIcon, SuperscriptIcon } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { DropdownMenu } from "@/components/base";
import { useTranslation } from "react-i18next";

export function MoreMarkDropdownMenu(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const openState = DropdownMenu.useOpenState();

    return (
        <DropdownMenu.Root modal={false} {...openState} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={openState.open} tooltip={t("editor.More")}>
                    <MoreHorizontalIcon />
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
                className="ignore-click-outside/toolbar flex max-h-[min(70vh,300px)] min-w-[180px] flex-col overflow-y-auto"
                align="start"
            >
                <DropdownMenu.Group>
                    <DropdownMenu.Item
                        onSelect={() => {
                            editor.tf.toggle.mark({ key: KbdPlugin.key });
                            collapseSelection(editor, { edge: "end" });
                            focusEditor(editor);
                        }}
                    >
                        <KeyboardIcon className="size-4" />
                        {t("editor.Keyboard input")}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={() => {
                            (editor.tf as any).insert.inlineEquation();
                        }}
                    >
                        <RadicalIcon className="size-4" />
                        {t("editor.Inline equation")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onSelect={() => {
                            editor.tf.toggle.mark({
                                key: SuperscriptPlugin.key,
                                clear: [SubscriptPlugin.key, SuperscriptPlugin.key],
                            });
                            focusEditor(editor);
                        }}
                    >
                        <SuperscriptIcon className="size-4" />
                        {t("editor.Superscript")}
                        {/* (⌘+,) */}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        onSelect={() => {
                            editor.tf.toggle.mark({
                                key: SubscriptPlugin.key,
                                clear: [SuperscriptPlugin.key, SubscriptPlugin.key],
                            });
                            focusEditor(editor);
                        }}
                    >
                        <SubscriptIcon className="size-4" />
                        {t("editor.Subscript")}
                        {/* (⌘+.) */}
                    </DropdownMenu.Item>
                </DropdownMenu.Group>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
