"use client";

import * as React from "react";
import { withProps } from "@udecode/cn";
import { BaseParagraphPlugin, SlateLeaf } from "@udecode/plate";
import { useAIChatEditor } from "@udecode/plate-ai/react";
import {
    BaseBoldPlugin,
    BaseCodePlugin,
    BaseItalicPlugin,
    BaseStrikethroughPlugin,
    BaseSubscriptPlugin,
    BaseSuperscriptPlugin,
    BaseUnderlinePlugin,
} from "@udecode/plate-basic-marks";
import { BaseBlockquotePlugin } from "@udecode/plate-block-quote";
import { BaseCalloutPlugin } from "@udecode/plate-callout";
import { BaseCodeBlockPlugin, BaseCodeLinePlugin, BaseCodeSyntaxPlugin } from "@udecode/plate-code-block";
import { BaseDatePlugin } from "@udecode/plate-date";
import { BaseHeadingPlugin, BaseTocPlugin, HEADING_KEYS } from "@udecode/plate-heading";
import { BaseHighlightPlugin } from "@udecode/plate-highlight";
import { BaseHorizontalRulePlugin } from "@udecode/plate-horizontal-rule";
import { BaseIndentPlugin } from "@udecode/plate-indent";
import { BaseIndentListPlugin } from "@udecode/plate-indent-list";
import { BaseKbdPlugin } from "@udecode/plate-kbd";
import { BaseLinkPlugin } from "@udecode/plate-link";
import { BaseEquationPlugin, BaseInlineEquationPlugin } from "@udecode/plate-math";
import { BaseAudioPlugin, BaseFilePlugin, BaseImagePlugin, BaseVideoPlugin } from "@udecode/plate-media";
import { BaseMentionPlugin } from "@udecode/plate-mention";
import { BaseTableCellHeaderPlugin, BaseTableCellPlugin, BaseTablePlugin, BaseTableRowPlugin } from "@udecode/plate-table";
import { usePlateEditor } from "@udecode/plate/react";
import { all, createLowlight } from "lowlight";
import { markdownPlugin } from "@/components/Editor/plugins/markdown-plugin";
import { TodoLiStatic, TodoMarkerStatic } from "@/components/plate-ui/indent-todo-marker-static";
import { BlockquoteElementStatic } from "@/components/plate-ui/blockquote-element-static";
import { CalloutElementStatic } from "@/components/plate-ui/callout-element-static";
import { CodeBlockElementStatic } from "@/components/plate-ui/code-block-element-static";
import { CodeLeafStatic } from "@/components/plate-ui/code-leaf-static";
import { CodeLineElementStatic } from "@/components/plate-ui/code-line-element-static";
import { CodeSyntaxLeafStatic } from "@/components/plate-ui/code-syntax-leaf-static";
import { DateElement } from "@/components/plate-ui/date-element";
import { EditorStatic } from "@/components/plate-ui/editor-static";
import { EquationElementStatic } from "@/components/plate-ui/equation-element-static";
import { HeadingElementStatic } from "@/components/plate-ui/heading-element-static";
import { HighlightLeafStatic } from "@/components/plate-ui/highlight-leaf-static";
import { HrElementStatic } from "@/components/plate-ui/hr-element-static";
import { ImageElementStatic } from "@/components/plate-ui/image-element-static";
import { InlineEquationElementStatic } from "@/components/plate-ui/inline-equation-element-static";
import { KbdLeaf } from "@/components/plate-ui/kbd-leaf";
import { LinkElementStatic } from "@/components/plate-ui/link-element-static";
import { MediaAudioElementStatic } from "@/components/plate-ui/media-audio-element-static";
import { MediaFileElementStatic } from "@/components/plate-ui/media-file-element-static";
import { MediaVideoElementStatic } from "@/components/plate-ui/media-video-element-static";
import { MentionElementStatic } from "@/components/plate-ui/mention-element-static";
import { ParagraphElementStatic } from "@/components/plate-ui/paragraph-element-static";
import { TableCellElementStatic, TableCellHeaderStaticElement } from "@/components/plate-ui/table-cell-element-static";
import { TableElementStatic } from "@/components/plate-ui/table-element-static";
import { TableRowElementStatic } from "@/components/plate-ui/table-row-element-static";
import { TocElementStatic } from "@/components/plate-ui/toc-element-static";

const components = {
    [BaseAudioPlugin.key]: MediaAudioElementStatic,
    [BaseBlockquotePlugin.key]: BlockquoteElementStatic,
    [BaseBoldPlugin.key]: withProps(SlateLeaf, { as: "strong" }),
    [BaseCalloutPlugin.key]: CalloutElementStatic,
    [BaseCodeBlockPlugin.key]: CodeBlockElementStatic,
    [BaseCodeLinePlugin.key]: CodeLineElementStatic,
    [BaseCodePlugin.key]: CodeLeafStatic,
    [BaseCodeSyntaxPlugin.key]: CodeSyntaxLeafStatic,
    [BaseDatePlugin.key]: DateElement,
    [BaseEquationPlugin.key]: EquationElementStatic,
    [BaseFilePlugin.key]: MediaFileElementStatic,
    [BaseHighlightPlugin.key]: HighlightLeafStatic,
    [BaseHorizontalRulePlugin.key]: HrElementStatic,
    [BaseImagePlugin.key]: ImageElementStatic,
    [BaseInlineEquationPlugin.key]: InlineEquationElementStatic,
    [BaseItalicPlugin.key]: withProps(SlateLeaf, { as: "em" }),
    [BaseKbdPlugin.key]: KbdLeaf,
    [BaseLinkPlugin.key]: LinkElementStatic,
    [BaseMentionPlugin.key]: withProps(MentionElementStatic, { prefix: "@" }),
    [BaseParagraphPlugin.key]: ParagraphElementStatic,
    [BaseStrikethroughPlugin.key]: withProps(SlateLeaf, { as: "s" }),
    [BaseSubscriptPlugin.key]: withProps(SlateLeaf, { as: "sub" }),
    [BaseSuperscriptPlugin.key]: withProps(SlateLeaf, { as: "sup" }),
    [BaseTableCellHeaderPlugin.key]: TableCellHeaderStaticElement,
    [BaseTableCellPlugin.key]: TableCellElementStatic,
    [BaseTablePlugin.key]: TableElementStatic,
    [BaseTableRowPlugin.key]: TableRowElementStatic,
    [BaseTocPlugin.key]: TocElementStatic,
    [BaseUnderlinePlugin.key]: withProps(SlateLeaf, { as: "u" }),

    [BaseVideoPlugin.key]: MediaVideoElementStatic,
    [HEADING_KEYS.h1]: withProps(HeadingElementStatic, { variant: "h1" }),

    [HEADING_KEYS.h2]: withProps(HeadingElementStatic, { variant: "h2" }),
    [HEADING_KEYS.h3]: withProps(HeadingElementStatic, { variant: "h3" }),
};
const lowlight = createLowlight(all);

const plugins = [
    BaseBlockquotePlugin,
    BaseSubscriptPlugin,
    BaseSuperscriptPlugin,
    BaseImagePlugin,
    BaseKbdPlugin,
    BaseBoldPlugin,
    BaseCodeBlockPlugin.configure({ options: { lowlight } }),
    BaseDatePlugin,
    BaseEquationPlugin,
    BaseInlineEquationPlugin,
    BaseCodePlugin,
    BaseItalicPlugin,
    BaseStrikethroughPlugin,
    BaseUnderlinePlugin,
    BaseHeadingPlugin,
    BaseHorizontalRulePlugin,
    BaseTablePlugin,
    BaseTocPlugin,
    BaseHighlightPlugin,
    BaseLinkPlugin,
    BaseMentionPlugin,
    BaseParagraphPlugin,
    BaseCalloutPlugin,
    BaseIndentPlugin.extend({
        inject: {
            targetPlugins: [BaseParagraphPlugin.key],
        },
    }),
    BaseIndentListPlugin.extend({
        inject: {
            targetPlugins: [BaseParagraphPlugin.key],
        },
        options: {
            listStyleTypes: {
                todo: {
                    liComponent: TodoLiStatic,
                    markerComponent: TodoMarkerStatic,
                    type: "todo",
                },
            },
        },
    }),
    markdownPlugin,
];

export const AIChatEditor = React.memo(function AIChatEditor({ content }: { content: string }) {
    const aiEditor = usePlateEditor({
        plugins,
    });

    useAIChatEditor(aiEditor, content);

    return <EditorStatic variant="aiChat" components={components} editor={aiEditor} />;
});
