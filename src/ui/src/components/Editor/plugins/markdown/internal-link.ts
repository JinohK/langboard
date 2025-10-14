/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { Node, Parent } from "mdast";
import { MdMath } from "@platejs/markdown";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { INTERNAL_LINK_KEY, INTERNAL_LINK_TYPES, TInternalLinkElement } from "@/components/Editor/plugins/customs/internal-link/InternalLinkPlugin";

export interface IInternalLinkNode extends Omit<MdMath, "type"> {
    internalType: TInternalLinkElement["internalType"];
    uid: string;
    type: typeof INTERNAL_LINK_KEY;
}

declare module "mdast" {
    interface RootContentMap {
        internalLink: IInternalLinkNode;
    }
}

export const remark: Plugin = function () {
    return (tree: Node) => {
        visit(tree, "text", (node: MdMath, index: number, parent: Parent | undefined) => {
            if (!parent || typeof index !== "number") {
                return;
            }

            const matchRegex = new RegExp(`\\[\\[(${INTERNAL_LINK_TYPES.join("|")}):([a-zA-Z0-9_-]+)\\]\\]`, "g");
            const match = matchRegex.exec(node.value);
            if (!match) {
                return;
            }

            const [, internalType, uid] = match;
            if (!INTERNAL_LINK_TYPES.includes(internalType as TInternalLinkElement["internalType"])) {
                return;
            }

            const beforeText = node.value.slice(0, match.index);
            const afterText = node.value.slice(match.index + match[0].length);

            const nodes: any[] = [];
            if (beforeText) {
                nodes.push({ type: "text", value: beforeText });
            }

            nodes.push({
                type: INTERNAL_LINK_KEY,
                internalType: internalType as TInternalLinkElement["internalType"],
                uid,
            } as IInternalLinkNode);
            if (afterText) {
                nodes.push({ type: "text", value: afterText });
            }

            parent.children.splice(index, 1, ...nodes);
        });
    };
};

export const rules = {
    internalLink: {
        deserialize: (node: IInternalLinkNode): TInternalLinkElement => ({
            children: [{ text: "" }],
            type: INTERNAL_LINK_KEY,
            internalType: node.internalType,
            uid: node.uid,
        }),
        serialize: (node: TInternalLinkElement) => ({
            type: "text",
            value: `[[${node.internalType}:${node.uid}]]`,
        }),
    },
};
