import type { TDescendant } from "@udecode/plate-common";

import type { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";

import { remarkTransformNode } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformNode";

export const remarkDefaultCompiler = (node: MdastNode, options: RemarkPluginOptions): TDescendant[] => {
    return (node.children || []).flatMap((child) => remarkTransformNode(child, options));
};
