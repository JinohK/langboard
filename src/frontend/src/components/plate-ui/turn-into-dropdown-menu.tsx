/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin } from "@udecode/plate-code-block/react";
import { ParagraphPlugin, focusEditor, useEditorRef, useEditorSelector, useSelectionFragmentProp } from "@udecode/plate-common/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { INDENT_LIST_KEYS, ListStyleType } from "@udecode/plate-indent-list";
import { FileCodeIcon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, PilcrowIcon, QuoteIcon, SquareIcon } from "lucide-react";
import { getBlockType, setBlockType } from "@/components/Editor/transforms";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { DropdownMenu } from "@/components/base";
import { someNode } from "@udecode/plate-common";
import { TablePlugin } from "@udecode/plate-table/react";
import { useTranslation } from "react-i18next";

const turnIntoItems = [
    {
        icon: <PilcrowIcon className="size-4" />,
        keywords: ["paragraph"],
        label: "editor.Text",
        value: ParagraphPlugin.key,
    },
    {
        icon: <Heading1Icon className="size-4" />,
        keywords: ["title", "h1"],
        label: "editor.Heading 1",
        value: HEADING_KEYS.h1,
    },
    {
        icon: <Heading2Icon className="size-4" />,
        keywords: ["subtitle", "h2"],
        label: "editor.Heading 2",
        value: HEADING_KEYS.h2,
    },
    {
        icon: <Heading3Icon className="size-4" />,
        keywords: ["subtitle", "h3"],
        label: "editor.Heading 3",
        value: HEADING_KEYS.h3,
    },
    {
        icon: <ListIcon className="size-4" />,
        keywords: ["unordered", "ul", "-"],
        label: "editor.Bulleted list",
        value: ListStyleType.Disc,
    },
    {
        icon: <ListOrderedIcon className="size-4" />,
        keywords: ["ordered", "ol", "1"],
        label: "editor.Numbered list",
        value: ListStyleType.Decimal,
    },
    {
        icon: <SquareIcon className="size-4" />,
        keywords: ["checklist", "task", "checkbox", "[]"],
        label: "editor.To-do list",
        value: INDENT_LIST_KEYS.todo,
    },
    {
        icon: <FileCodeIcon className="size-4" />,
        keywords: ["```"],
        label: "editor.Code",
        value: CodeBlockPlugin.key,
    },
    {
        icon: <QuoteIcon className="size-4" />,
        keywords: ["citation", "blockquote", ">"],
        label: "editor.Quote",
        value: BlockquotePlugin.key,
    },
];

export function TurnIntoDropdownMenu(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const openState = DropdownMenu.useOpenState();
    const tableSelected = useEditorSelector((editor) => someNode(editor, { match: { type: TablePlugin.key } }), []);

    const value = useSelectionFragmentProp({
        defaultValue: ParagraphPlugin.key,
        getProp: (node) => getBlockType(node as any),
    });
    const selectedItem = React.useMemo(
        () => turnIntoItems.find((item) => item.value === (value ?? ParagraphPlugin.key)) ?? turnIntoItems[0],
        [value]
    );

    return (
        <DropdownMenu.Root modal={false} {...openState} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={openState.open} tooltip={t("editor.Turn into")} isDropdown disabled={tableSelected}>
                    {t(selectedItem.label)}
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="ignore-click-outside/toolbar max-h-[min(70vh,300px)] min-w-0 overflow-auto" align="start">
                <DropdownMenu.RadioGroup
                    value={value}
                    onValueChange={(type) => {
                        setBlockType(editor, type);
                        focusEditor(editor);
                    }}
                    label={t("editor.Turn into")}
                >
                    {turnIntoItems.map(({ icon, label, value: itemValue }) => (
                        <DropdownMenu.RadioItem key={itemValue} className="min-w-[180px]" value={itemValue}>
                            {icon}
                            {t(label)}
                        </DropdownMenu.RadioItem>
                    ))}
                </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
