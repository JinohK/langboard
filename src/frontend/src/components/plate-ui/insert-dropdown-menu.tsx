"use client";

import React from "react";
import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin } from "@udecode/plate-code-block/react";
import { type PlateEditor, ParagraphPlugin, focusEditor, useEditorRef } from "@udecode/plate-common/react";
import { DatePlugin } from "@udecode/plate-date/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { TocPlugin } from "@udecode/plate-heading/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { INDENT_LIST_KEYS, ListStyleType } from "@udecode/plate-indent-list";
import { LinkPlugin } from "@udecode/plate-link/react";
import { TablePlugin } from "@udecode/plate-table/react";
import {
    CalendarIcon,
    FileCodeIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    Link2Icon,
    ListIcon,
    ListOrderedIcon,
    MinusIcon,
    PilcrowIcon,
    PlusIcon,
    QuoteIcon,
    RadicalIcon,
    SquareIcon,
    TableIcon,
    TableOfContentsIcon,
} from "lucide-react";
import { insertBlock, insertInlineElement } from "@/components/Editor/transforms";
import { ToolbarButton } from "@/components/plate-ui/toolbar";
import { DropdownMenu } from "@/components/base";
import { useTranslation } from "react-i18next";
import { EquationPlugin, InlineEquationPlugin } from "@udecode/plate-math/react";

type Group = {
    group: string;
    items: Item[];
};

interface Item {
    icon: React.ReactNode;
    onSelect: (editor: PlateEditor, value: string) => void;
    value: string;
    focusEditor?: bool;
    label?: string;
}

const groups: Group[] = [
    {
        group: "editor.Basic blocks",
        items: [
            {
                icon: <PilcrowIcon className="size-4" />,
                label: "editor.Paragraph",
                value: ParagraphPlugin.key,
            },
            {
                icon: <Heading1Icon className="size-4" />,
                label: "editor.Heading 1",
                value: HEADING_KEYS.h1,
            },
            {
                icon: <Heading2Icon className="size-4" />,
                label: "editor.Heading 2",
                value: HEADING_KEYS.h2,
            },
            {
                icon: <Heading3Icon className="size-4" />,
                label: "editor.Heading 3",
                value: HEADING_KEYS.h3,
            },
            {
                icon: <TableIcon className="size-4" />,
                label: "editor.Table",
                value: TablePlugin.key,
            },
            {
                icon: <FileCodeIcon className="size-4" />,
                label: "editor.Code",
                value: CodeBlockPlugin.key,
            },
            {
                icon: <QuoteIcon className="size-4" />,
                label: "editor.Quote",
                value: BlockquotePlugin.key,
            },
            {
                icon: <MinusIcon className="size-4" />,
                label: "editor.Divider",
                value: HorizontalRulePlugin.key,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "editor.Lists",
        items: [
            {
                icon: <ListIcon className="size-4" />,
                label: "editor.Bulleted list",
                value: ListStyleType.Disc,
            },
            {
                icon: <ListOrderedIcon className="size-4" />,
                label: "editor.Numbered list",
                value: ListStyleType.Decimal,
            },
            {
                icon: <SquareIcon className="size-4" />,
                label: "editor.To-do list",
                value: INDENT_LIST_KEYS.todo,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "editor.Advanced blocks",
        items: [
            {
                icon: <TableOfContentsIcon className="size-4" />,
                label: "editor.Table of contents",
                value: TocPlugin.key,
            },
            {
                icon: <RadicalIcon className="size-4" />,
                label: "editor.Equation",
                value: EquationPlugin.key,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "editor.Inline",
        items: [
            {
                icon: <Link2Icon className="size-4" />,
                label: "editor.Link",
                value: LinkPlugin.key,
            },
            {
                focusEditor: true,
                icon: <CalendarIcon className="size-4" />,
                label: "editor.Date",
                value: DatePlugin.key,
            },
            {
                icon: <RadicalIcon className="size-4" />,
                label: "editor.Inline equation",
                value: InlineEquationPlugin.key,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertInlineElement(editor, value);
            },
        })),
    },
];

export function InsertDropdownMenu(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const openState = DropdownMenu.useOpenState();

    return (
        <DropdownMenu.Root modal={false} {...openState} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={openState.open} tooltip={t("editor.Insert")} isDropdown>
                    <PlusIcon />
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="flex max-h-[min(70vh,300px)] min-w-0 flex-col overflow-y-auto" align="start">
                {groups.map(({ group, items: nestedItems }) => (
                    <DropdownMenu.Group key={group} label={t(group)}>
                        {nestedItems.map(({ icon, label, value, onSelect }) => (
                            <DropdownMenu.Item
                                key={value}
                                className="min-w-[180px]"
                                onSelect={() => {
                                    onSelect(editor, value);
                                    focusEditor(editor);
                                }}
                            >
                                {icon}
                                {label && t(label)}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Group>
                ))}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
