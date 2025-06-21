/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MarkdownPlugin, remarkMdx } from "@udecode/plate-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { EscapeMarkdown, MentionMarkdown, PlantUMLMarkdown } from "@/components/Editor/plugins/markdown";
import { bindFirst } from "@udecode/plate";

export const markdownPlugin = MarkdownPlugin.configure({
    options: {
        disallowedNodes: [],
        remarkPlugins: [PlantUMLMarkdown.remark, remarkMath, remarkGfm, remarkMdx, MentionMarkdown.remark],
        rules: {
            ...(MentionMarkdown.rules as any),
            ...PlantUMLMarkdown.rules,
        },
    },
}).extendApi(({ editor }) => ({
    deserialize: bindFirst(EscapeMarkdown.deserialize(false), editor),
    deserializeInlineMd: bindFirst(EscapeMarkdown.deserialize(true), editor),
}));
