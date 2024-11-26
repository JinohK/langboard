import type { TDescendant } from "@udecode/plate-common";

import type { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";

import { remarkTransformNode } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformNode";

export const remarkTransformElementChildren = (node: MdastNode, options: RemarkPluginOptions): TDescendant[] => {
    const { children } = node;

    if (!children || children.length === 0) {
        return [{ text: "" }];
    }

    return children.flatMap((child) => remarkTransformNode(child, options));
};
