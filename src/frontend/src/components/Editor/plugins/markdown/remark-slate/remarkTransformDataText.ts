/* eslint-disable @typescript-eslint/no-explicit-any */
import { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";
import { TDescendant } from "@udecode/plate-common";

export const remarkTransformDataText = (
    node: MdastNode,
    options: RemarkPluginOptions,
    inheritedMarkProps: Record<string, bool> = {}
): TDescendant[] => {
    const { dataTextRules } = options;

    const { type } = node;
    const dataTextRule = (dataTextRules as any)[type!];

    if (!dataTextRule) return [];

    const data = dataTextRule.transform(node, options, inheritedMarkProps);
    if (!data) {
        return [];
    }

    return data;
};
