/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TElement } from "@udecode/plate";
import type { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";

export const remarkTransformElement = (node: MdastNode, options: RemarkPluginOptions): TElement | TElement[] => {
    const { elementRules } = options;

    const { type } = node;
    const elementRule = (elementRules as any)[type!];

    if (!elementRule) return [];

    return elementRule.transform(node, options);
};
