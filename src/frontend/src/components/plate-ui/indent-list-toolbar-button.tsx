"use client";

import * as React from "react";
import { ListStyleType, someIndentList, toggleIndentList } from "@udecode/plate-indent-list";
import { List, ListOrdered } from "lucide-react";
import { ToolbarSplitButton, ToolbarSplitButtonPrimary, ToolbarSplitButtonSecondary } from "@/components/plate-ui/toolbar";
import { useTranslation } from "react-i18next";
import { useEditorRef, useEditorSelector } from "@udecode/plate/react";
import { DropdownMenu } from "@/components/base";

const INDENT_LIST = [
    {
        type: ListStyleType.Disc,
        icon: <List />,
        label: "editor.Bulleted list",
    },
    {
        type: ListStyleType.Decimal,
        icon: <ListOrdered />,
        label: "editor.Numbered list",
    },
];

export function IndentListToolbarButton() {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const [open, setOpen] = React.useState(false);
    const pressed = useEditorSelector(
        (editor) =>
            someIndentList(
                editor,
                Object.values(INDENT_LIST).map((indent) => indent.type)
            ),
        []
    );

    return (
        <ToolbarSplitButton pressed={open}>
            <ToolbarSplitButtonPrimary
                className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                onClick={() => {
                    toggleIndentList(editor, {
                        listStyleType: ListStyleType.Disc,
                    });
                }}
                data-state={pressed ? "on" : "off"}
            >
                <List className="size-4" />
            </ToolbarSplitButtonPrimary>
            <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
                <DropdownMenu.Trigger asChild>
                    <ToolbarSplitButtonSecondary />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" alignOffset={-32}>
                    <DropdownMenu.Group>
                        {INDENT_LIST.map((item) => (
                            <DropdownMenu.Item
                                onClick={() =>
                                    toggleIndentList(editor, {
                                        listStyleType: ListStyleType.Disc,
                                    })
                                }
                            >
                                <div className="flex items-center gap-2">
                                    {item.icon}
                                    {t(item.label)}
                                </div>
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Group>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </ToolbarSplitButton>
    );
}
