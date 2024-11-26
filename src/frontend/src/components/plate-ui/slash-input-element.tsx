"use client";

import React from "react";
import { withRef } from "@udecode/cn";
import { AIChatPlugin } from "@udecode/plate-ai/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin } from "@udecode/plate-code-block/react";
import { type PlateEditor, ParagraphPlugin } from "@udecode/plate-common/react";
import { DatePlugin } from "@udecode/plate-date/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { TocPlugin } from "@udecode/plate-heading/react";
import { INDENT_LIST_KEYS, ListStyleType } from "@udecode/plate-indent-list";
import { TablePlugin } from "@udecode/plate-table/react";
import {
    CalendarIcon,
    Code2,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    ListIcon,
    ListOrdered,
    PilcrowIcon,
    Quote,
    RadicalIcon,
    SparklesIcon,
    Square,
    Table,
    TableOfContentsIcon,
} from "lucide-react";
import { insertBlock, insertInlineElement } from "@/components/Editor/transforms";
import {
    InlineCombobox,
    InlineComboboxContent,
    InlineComboboxEmpty,
    InlineComboboxGroup,
    InlineComboboxGroupLabel,
    InlineComboboxInput,
    InlineComboboxItem,
} from "./inline-combobox";
import { PlateElement } from "./plate-element";
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
    className?: string;
    focusEditor?: bool;
    keywords?: string[];
    label?: string;
}

const groups: Group[] = [
    {
        group: "editor.AI",
        items: [
            {
                focusEditor: false,
                icon: <SparklesIcon />,
                value: "AI",
                label: "editor.AI",
                onSelect: (editor) => {
                    editor.getApi(AIChatPlugin).aiChat.show();
                },
            },
        ],
    },
    {
        group: "editor.Basic blocks",
        items: [
            {
                icon: <PilcrowIcon />,
                keywords: ["paragraph"],
                label: "editor.Text",
                value: ParagraphPlugin.key,
            },
            {
                icon: <Heading1Icon />,
                keywords: ["title", "h1"],
                label: "editor.Heading 1",
                value: HEADING_KEYS.h1,
            },
            {
                icon: <Heading2Icon />,
                keywords: ["subtitle", "h2"],
                label: "editor.Heading 2",
                value: HEADING_KEYS.h2,
            },
            {
                icon: <Heading3Icon />,
                keywords: ["subtitle", "h3"],
                label: "editor.Heading 3",
                value: HEADING_KEYS.h3,
            },
            {
                icon: <ListIcon />,
                keywords: ["unordered", "ul", "-"],
                label: "editor.Bulleted list",
                value: ListStyleType.Disc,
            },
            {
                icon: <ListOrdered />,
                keywords: ["ordered", "ol", "1"],
                label: "editor.Numbered list",
                value: ListStyleType.Decimal,
            },
            {
                icon: <Square />,
                keywords: ["checklist", "task", "checkbox", "[]"],
                label: "editor.To-do list",
                value: INDENT_LIST_KEYS.todo,
            },
            {
                icon: <Code2 />,
                keywords: ["```"],
                label: "editor.Code Block",
                value: CodeBlockPlugin.key,
            },
            {
                icon: <Table />,
                label: "editor.Table",
                value: TablePlugin.key,
            },
            {
                icon: <Quote />,
                keywords: ["citation", "blockquote", "quote", ">"],
                label: "editor.Blockquote",
                value: BlockquotePlugin.key,
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
                icon: <TableOfContentsIcon />,
                keywords: ["toc"],
                label: "editor.Table of contents",
                value: TocPlugin.key,
            },
            {
                icon: <RadicalIcon />,
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
                focusEditor: true,
                icon: <CalendarIcon />,
                keywords: ["time"],
                label: "editor.Date",
                value: DatePlugin.key,
            },
            {
                icon: <RadicalIcon />,
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

export const SlashInputElement = withRef<typeof PlateElement>(({ className, ...props }, ref) => {
    const [t] = useTranslation();
    const { children, editor, element } = props;

    return (
        <PlateElement ref={ref} as="span" data-slate-value={element.value} {...props}>
            <InlineCombobox element={element} trigger="/">
                <InlineComboboxInput />

                <InlineComboboxContent>
                    <InlineComboboxEmpty>{t("editor.No results")}</InlineComboboxEmpty>

                    {groups.map(({ group, items }) => (
                        <InlineComboboxGroup key={group}>
                            <InlineComboboxGroupLabel>{t(group)}</InlineComboboxGroupLabel>

                            {items.map(({ focusEditor, icon, keywords, label, value, onSelect }) => (
                                <InlineComboboxItem
                                    key={value}
                                    value={value}
                                    onClick={() => onSelect(editor, value)}
                                    label={label ? t(label) : undefined}
                                    focusEditor={focusEditor}
                                    group={group}
                                    keywords={keywords}
                                >
                                    <div className="mr-2 text-muted-foreground">{icon}</div>
                                    {t(label ?? value)}
                                </InlineComboboxItem>
                            ))}
                        </InlineComboboxGroup>
                    ))}
                </InlineComboboxContent>
            </InlineCombobox>

            {children}
        </PlateElement>
    );
});
