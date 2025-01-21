import type { Descendant } from "@udecode/plate";
import type { MdastNode, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";
import { remarkTextTypes } from "@/components/Editor/plugins/markdown/remark-slate/remarkTextTypes";
import { remarkTransformElement } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformElement";
import { remarkTransformText } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformText";
import { getDataTextType, isDataTextType } from "@/components/Editor/plugins/markdown/remark-slate/remarkDataText";
import { remarkDataTypes } from "@/components/Editor/plugins/markdown/remark-slate/remarkDataTypes";
import { remarkTransformDataText } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformDataText";

export const remarkTransformNode = (node: MdastNode, options: RemarkPluginOptions): Descendant | Descendant[] => {
    const { type, value } = node;
    const targetType = isDataTextType(value) ? (getDataTextType(value) ?? "text") : type;
    node.type = targetType;
    if (node.type === "html" && node.value === "<br>") {
        node.type = "paragraph";
        delete node.value;
        node.children = [{ type: "html", value: "", position: node.position }];
    }

    let html = "";
    let indexShouldWrap = -1;
    let indexShouldUnwrap = -1;

    const newChildren: MdastNode[] = [];

    for (let i = 0; i < (node.children?.length ?? 0); ++i) {
        const child = node.children![i];
        if (child.value?.includes("<br>")) {
            newChildren.push(child);
            continue;
        } else if (child.type === "html") {
            if (!child.value?.startsWith("</") && indexShouldWrap === -1) {
                indexShouldWrap = i;
            }

            if (child.value?.startsWith("</") && indexShouldWrap !== -1) {
                indexShouldUnwrap = i;
            }
        } else {
            if (indexShouldWrap === -1) {
                newChildren.push(child);
                continue;
            }
        }

        if (indexShouldWrap !== -1) {
            html += child.value;
        }

        if (indexShouldUnwrap !== -1) {
            newChildren.push({ type: "html", value: html });
            indexShouldWrap = -1;
            indexShouldUnwrap = -1;
            html = "";
        }
    }

    if (newChildren.length) {
        node.children = newChildren;
    }

    if (remarkDataTypes.includes(targetType!)) {
        return remarkTransformDataText(node, options);
    }

    if (remarkTextTypes.includes(targetType!)) {
        return remarkTransformText(node, options);
    }

    return remarkTransformElement(node, options);
};
