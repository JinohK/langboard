/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { focusEditor, useEditorReadOnly, useEditorRef, usePlateStore } from "@udecode/plate-common/react";
import { Eye, Pen } from "lucide-react";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { DropdownMenu } from "@/components/base";
import { useTranslation } from "react-i18next";

export function ModeDropdownMenu(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const setReadOnly = usePlateStore().set.readOnly();
    const readOnly = useEditorReadOnly();
    const openState = DropdownMenu.useOpenState();

    let value = "editing";

    if (readOnly) value = "viewing";

    const item: any = {
        editing: (
            <>
                <Pen className="size-4" />
                <span className="hidden lg:inline">{t("editor.Editing")}</span>
            </>
        ),
        viewing: (
            <>
                <Eye className="size-4" />
                <span className="hidden lg:inline">{t("editor.Viewing")}</span>
            </>
        ),
    };

    return (
        <DropdownMenu.Root modal={false} {...openState} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={openState.open} tooltip={t("editor.Editing mode")} isDropdown>
                    {item[value]}
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="min-w-[180px]" align="end">
                <DropdownMenu.RadioGroup
                    value={value}
                    onValueChange={(newValue) => {
                        if (newValue !== "viewing") {
                            setReadOnly(false);
                        }
                        if (newValue === "viewing") {
                            setReadOnly(true);

                            return;
                        }
                        if (newValue === "editing") {
                            focusEditor(editor);

                            return;
                        }
                    }}
                >
                    <DropdownMenu.RadioItem value="editing">{item.editing}</DropdownMenu.RadioItem>

                    <DropdownMenu.RadioItem value="viewing">{item.viewing}</DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
