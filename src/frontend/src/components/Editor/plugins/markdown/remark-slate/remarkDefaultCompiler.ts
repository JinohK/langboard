import type { Descendant } from "@udecode/plate";
import type { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";
import { remarkTransformNode } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformNode";

export const remarkDefaultCompiler = (node: MdastNode, options: RemarkPluginOptions): Descendant[] => {
    return (node.children || []).flatMap((child) => remarkTransformNode(child, options));
};
