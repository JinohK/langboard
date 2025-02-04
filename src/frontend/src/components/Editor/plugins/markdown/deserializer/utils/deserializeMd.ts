/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SlateEditor } from "@udecode/plate";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
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
import { parseMarkdownBlocks, ParseMarkdownBlocksOptions } from "@/components/Editor/plugins/markdown/deserializer/utils/parseMarkdownBlocks";
import TypeUtils from "@/core/utils/TypeUtils";

export type DeserializeMdOptions = {
    /** Whether to add _memo property to elements */
    memoize?: boolean;
    /** Options for the token parser */
    parser?: ParseMarkdownBlocksOptions;
    /** A function that allows you to modify the markdown processor. */
    processor?: (processor: Processor) => Processor;
};

/** Deserialize content from Markdown format to Slate format. */
export const deserializeMd = (editor: SlateEditor, data: string, { memoize, parser, processor }: DeserializeMdOptions = {}) => {
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
        .use(remarkEmoji)
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
        } as unknown as RemarkPluginOptions);

    if (memoize) {
        return parseMarkdownBlocks(data, parser).flatMap((token) => {
            if (token.type === "space") {
                return {
                    ...editor.api.create.block(),
                    _memo: token.raw,
                };
            }

            // TODO: split list items
            return tree.processSync(token.raw).result.map((result: any) => {
                return {
                    _memo: token.raw,
                    ...result,
                };
            });
        });
    }

    return tree.processSync(data).result;
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
