/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TText } from "@udecode/plate";
import type { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";
import { remarkDefaultTextRules } from "@/components/Editor/plugins/markdown/remark-slate/remarkDefaultTextRules";
import { getDataTextType, isDataTextType } from "@/components/Editor/plugins/markdown/remark-slate/remarkDataText";
import { remarkTransformDataText } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformDataText";

export const remarkTransformText = (
    node: MdastNode,
    options: RemarkPluginOptions,
    inheritedMarkProps: Record<string, bool> = {}
): TText | TText[] => {
    const { editor, textRules } = options;

    const { children, value } = node;
    if (value && isDataTextType(value)) {
        node.type = getDataTextType(value) ?? "text";
        return remarkTransformDataText(node, options, inheritedMarkProps) as TText[];
    }

    const textRule = (textRules as any)[node.type!] || remarkDefaultTextRules.text;

    const { mark, transform = (text: string) => text, parseData = (_: string) => ({}) } = textRule;

    const parsedData: Record<string, unknown> = parseData(value, { editor });
    inheritedMarkProps = { ...inheritedMarkProps, ...(parsedData as Record<string, bool>) };

    const markProps = mark
        ? {
              ...inheritedMarkProps,
              [mark({ editor })]: true,
              ...parsedData,
          }
        : inheritedMarkProps;

    const childTextNodes = children?.flatMap((child) => remarkTransformText(child, options, markProps)) || [];

    const currentTextNodes = value || childTextNodes.length === 0 ? [{ text: transform(value || ""), ...markProps } as TText] : [];

    return [...currentTextNodes, ...childTextNodes];
};
