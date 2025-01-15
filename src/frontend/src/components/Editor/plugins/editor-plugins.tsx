"use client";

import { CalloutPlugin } from "@udecode/plate-callout/react";
import { ParagraphPlugin } from "@udecode/plate-common/react";
import { DatePlugin } from "@udecode/plate-date/react";
import { DocxPlugin } from "@udecode/plate-docx";
import { EmojiPlugin } from "@udecode/plate-emoji/react";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { JuicePlugin } from "@udecode/plate-juice";
import { KbdPlugin } from "@udecode/plate-kbd/react";
import { EquationPlugin, InlineEquationPlugin } from "@udecode/plate-math/react";
import { SlashPlugin } from "@udecode/plate-slash-command/react";
import { TrailingBlockPlugin } from "@udecode/plate-trailing-block";
import { FixedToolbarPlugin } from "@/components/Editor/plugins/fixed-toolbar-plugin";
import { FloatingToolbarPlugin } from "@/components/Editor/plugins/floating-toolbar-plugin";
import { autoformatPlugin } from "@/components/Editor/plugins/autoformat-plugin";
import { basicNodesPlugins } from "@/components/Editor/plugins/basic-nodes-plugins";
import { blockMenuPlugins } from "@/components/Editor/plugins/block-menu-plugins";
import { cursorOverlayPlugin } from "@/components/Editor/plugins/cursor-overlay-plugin";
import { deletePlugins } from "@/components/Editor/plugins/delete-plugins";
import { dndPlugins } from "@/components/Editor/plugins/dnd-plugins";
import { exitBreakPlugin } from "@/components/Editor/plugins/exit-break-plugin";
import { indentListPlugins } from "@/components/Editor/plugins/indent-list-plugins";
import { linkPlugin } from "@/components/Editor/plugins/link-plugin";
import { mediaPlugins } from "@/components/Editor/plugins/media-plugins";
import { mentionPlugin } from "@/components/Editor/plugins/mention-plugin";
import { resetBlockTypePlugin } from "@/components/Editor/plugins/reset-block-type-plugin";
import { softBreakPlugin } from "@/components/Editor/plugins/soft-break-plugin";
import { tablePlugin } from "@/components/Editor/plugins/table-plugin";
import { tocPlugin } from "@/components/Editor/plugins/toc-plugin";
import { MarkdownPlugin } from "@/components/Editor/plugins/markdown";
import { equationPlugins } from "@/components/Editor/plugins/equation-plugin";
import { PlantUmlPlugin } from "@/components/Editor/plugins/plantuml-plugin";

export const viewPlugins = [
    ...basicNodesPlugins,
    ...equationPlugins,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PlantUmlPlugin as any,
    HorizontalRulePlugin,
    linkPlugin,
    DatePlugin,
    mentionPlugin,
    tablePlugin,
    tocPlugin,
    ...mediaPlugins,
    InlineEquationPlugin,
    EquationPlugin,
    CalloutPlugin,

    // Marks
    HighlightPlugin,
    KbdPlugin,

    // Block Style
    ...indentListPlugins,
    FloatingToolbarPlugin,

    // Deserialization
    MarkdownPlugin.configure({ options: { indentList: true } }),
] as const;

export const editorPlugins = [
    // Nodes
    ...viewPlugins,

    // Functionality
    SlashPlugin,
    autoformatPlugin,
    cursorOverlayPlugin,
    ...blockMenuPlugins,
    ...dndPlugins,
    EmojiPlugin,
    exitBreakPlugin,
    resetBlockTypePlugin,
    ...deletePlugins,
    softBreakPlugin,
    TrailingBlockPlugin.configure({ options: { type: ParagraphPlugin.key } }),

    // Deserialization
    DocxPlugin,
    JuicePlugin,

    // UI
    FixedToolbarPlugin,
];
