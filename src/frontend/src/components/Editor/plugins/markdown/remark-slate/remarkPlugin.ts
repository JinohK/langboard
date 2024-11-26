/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Processor } from "unified";

import type { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";

import { MarkdownPlugin } from "@/components/Editor/plugins/markdown/MarkdownPlugin";
import { remarkDefaultCompiler } from "@/components/Editor/plugins/markdown/remark-slate/remarkDefaultCompiler";
import { remarkSplitLineBreaksCompiler } from "@/components/Editor/plugins/markdown/remark-slate/remarkSplitLineBreaksCompiler";

export function remarkPlugin(this: Processor<undefined, undefined, undefined, MdastNode, any>, options: RemarkPluginOptions) {
    const shouldSplitLineBreaks = options.editor.getOptions(MarkdownPlugin).splitLineBreaks;

    const compiler = (node: MdastNode) => {
        if (shouldSplitLineBreaks) {
            return remarkSplitLineBreaksCompiler(node, options);
        }

        return remarkDefaultCompiler(node, options);
    };

    this.compiler = compiler;
}
