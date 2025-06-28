"use client";

import * as React from "react";
import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import {
    CalendarIcon,
    FileCodeIcon,
    GitCompare,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    LightbulbIcon,
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
    ImageIcon,
    FilmIcon,
} from "lucide-react";
import { KEYS } from "platejs";
import { type PlateEditor, useEditorRef } from "platejs/react";
import { DropdownMenu } from "@/components/base";
import { insertBlock, insertInlineElement } from "@/components/Editor/transforms";
import { ToolbarButton, ToolbarMenuGroup } from "./toolbar";
import { useTranslation } from "react-i18next";
import { PlantUmlPlugin } from "@/components/Editor/plugins/plantuml-plugin";

type Group = {
    group: string;
    items: Item[];
};

interface Item {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    focusEditor?: boolean;
    label?: string;
}

const groups: Group[] = [
    {
        group: "Basic blocks",
        items: [
            {
                icon: <PilcrowIcon className="size-4" />,
                label: "editor.Paragraph",
                value: KEYS.p,
            },
            {
                icon: <Heading1Icon className="size-4" />,
                label: "editor.Heading 1",
                value: "h1",
            },
            {
                icon: <Heading2Icon className="size-4" />,
                label: "editor.Heading 2",
                value: "h2",
            },
            {
                icon: <Heading3Icon className="size-4" />,
                label: "editor.Heading 3",
                value: "h3",
            },
            {
                icon: <TableIcon className="size-4" />,
                label: "editor.Table",
                value: KEYS.table,
            },
            {
                icon: <FileCodeIcon className="size-4" />,
                label: "editor.Code",
                value: KEYS.codeBlock,
            },
            {
                icon: <QuoteIcon className="size-4" />,
                label: "editor.Quote",
                value: KEYS.blockquote,
            },
            {
                icon: <MinusIcon className="size-4" />,
                label: "editor.Divider",
                value: KEYS.hr,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "Lists",
        items: [
            {
                icon: <ListIcon className="size-4" />,
                label: "editor.Bulleted list",
                value: KEYS.ul,
            },
            {
                icon: <ListOrderedIcon className="size-4" />,
                label: "editor.Numbered list",
                value: KEYS.ol,
            },
            {
                icon: <SquareIcon className="size-4" />,
                label: "editor.To-do list",
                value: KEYS.listTodo,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "Media",
        items: [
            {
                icon: <ImageIcon className="size-4" />,
                label: "editor.Image",
                value: KEYS.img,
            },
            {
                icon: <FilmIcon className="size-4" />,
                label: "editor.Embed",
                value: KEYS.mediaEmbed,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "Advanced blocks",
        items: [
            {
                icon: <TableOfContentsIcon className="size-4" />,
                label: "editor.Table of contents",
                value: KEYS.toc,
            },
            {
                icon: <LightbulbIcon className="size-4" />,
                label: "editor.Callout",
                value: KEYS.callout,
            },
            {
                icon: <RadicalIcon className="size-4" />,
                label: "editor.Equation",
                value: KEYS.equation,
            },
            {
                icon: <GitCompare className="size-4" />,
                label: "editor.Plant UML",
                value: PlantUmlPlugin.key,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertBlock(editor, value);
            },
        })),
    },
    {
        group: "Inline",
        items: [
            {
                icon: <Link2Icon className="size-4" />,
                label: "editor.Link",
                value: KEYS.link,
            },
            {
                focusEditor: true,
                icon: <CalendarIcon className="size-4" />,
                label: "editor.Date",
                value: KEYS.date,
            },
            {
                focusEditor: false,
                icon: <RadicalIcon className="size-4" />,
                label: "editor.Inline equation",
                value: KEYS.inlineEquation,
            },
        ].map((item) => ({
            ...item,
            onSelect: (editor, value) => {
                insertInlineElement(editor, value);
            },
        })),
    },
];

export function InsertToolbarButton(props: DropdownMenuProps) {
    const [t] = useTranslation();
    const editor = useEditorRef();
    const [open, setOpen] = React.useState(false);

    return (
        <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false} {...props}>
            <DropdownMenu.Trigger asChild>
                <ToolbarButton pressed={open} tooltip={t("editor.Insert")} isDropdown>
                    <PlusIcon />
                </ToolbarButton>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="flex max-h-[min(70vh,300px)] min-w-0 flex-col overflow-y-auto" align="start">
                {groups.map(({ group, items: nestedItems }) => (
                    <ToolbarMenuGroup key={group} label={group}>
                        {nestedItems.map(({ icon, label, value, onSelect }) => (
                            <DropdownMenu.Item
                                key={value}
                                className="min-w-[180px]"
                                onSelect={() => {
                                    onSelect(editor, value);
                                    editor.tf.focus();
                                }}
                            >
                                {icon}
                                {label && t(label)}
                            </DropdownMenu.Item>
                        ))}
                    </ToolbarMenuGroup>
                ))}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
