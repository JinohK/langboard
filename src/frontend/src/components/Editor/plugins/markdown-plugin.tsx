"use client";

import { MarkdownPlugin, remarkMdx } from "@udecode/plate-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { MentionMarkdown, PlantUMLMarkdown } from "@/components/Editor/plugins/markdown";

export const markdownPlugin = MarkdownPlugin.configure({
    options: {
        disallowedNodes: [],
        remarkPlugins: [PlantUMLMarkdown.remark, remarkMath, remarkGfm, remarkMdx, MentionMarkdown.remark],
        rules: {
            ...MentionMarkdown.rules,
            ...PlantUMLMarkdown.rules,
        },
    },
});
