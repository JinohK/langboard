/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SlateEditor } from "@udecode/plate-common";

import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import { type Processor, unified } from "unified";

import { MarkdownPlugin } from "@/components/Editor/plugins/markdown/MarkdownPlugin";
import {
    RemarkDataTextRules,
    type RemarkElementRules,
    type RemarkPluginOptions,
    type RemarkTextRules,
    remarkPlugin,
} from "@/components/Editor/plugins/markdown/remark-slate";
import { gfmHighlight, gfmHighlightFromMarkdown, gfmHighlightToMarkdown } from "@/components/Editor/plugins/markdown/remark-slate/remarkHighlight";
import TypeUtils from "@/core/utils/TypeUtils";

/** Deserialize content from Markdown format to Slate format. */
export const deserializeMd = (
    editor: SlateEditor,
    data: string,
    {
        processor,
    }: {
        processor?: (processor: Processor) => Processor;
    } = {}
) => {
    const elementRules: RemarkElementRules = {};
    const textRules: RemarkTextRules = {};
    const dataTextRules: RemarkDataTextRules = {};

    const options = editor.getOptions(MarkdownPlugin);

    Object.assign(elementRules, options.elementRules);
    Object.assign(textRules, options.textRules);
    Object.assign(dataTextRules, options.dataTextRules);

    let tree: any = unified().use(remarkParse);

    if (processor) {
        tree = processor(tree);
    }

    tree = tree
        .use(remarkGfm)
        .use(remarkMath)
        .use(function (this: any) {
            const data = this.data();
            data.fromMarkdownExtensions[0].push(gfmHighlightFromMarkdown());
            Object.entries(gfmHighlight()).forEach(([key, value]) => {
                Object.entries(value).forEach(([key2, value2]) => {
                    if (!data.micromarkExtensions[0][key][key2]) {
                        data.micromarkExtensions[0][key][key2] = [];
                    }

                    data.micromarkExtensions[0][key][key2].push(...(TypeUtils.isArray(value2) ? value2 : [value2]));
                });
            });
            data.toMarkdownExtensions[0].extensions.unshift(gfmHighlightToMarkdown());
        })
        .use(remarkPlugin, {
            editor,
            elementRules,
            indentList: options.indentList,
            textRules,
            dataTextRules,
        } as unknown as RemarkPluginOptions)
        .processSync(data);

    return tree.result;
};

// TODO: Collect rules from plugins
// editor.plugins.forEach((plugin: SlatePlugin) => {
//   if (plugin.parsers?.markdown?.deserialize) {
//     const { elementRules: pluginElementRules, textRules: pluginTextRules } =
//       plugin.parsers.markdown.deserialize as MarkdownDeserializer;
//
//     if (pluginElementRules) {
//       Object.assign(elementRules, pluginElementRules);
//     }
//     if (pluginTextRules) {
//       Object.assign(textRules, pluginTextRules);
//     }
//   }
// });
