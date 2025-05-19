"use client";

import type { Node, Parent } from "mdast";
import { MdMath } from "@udecode/plate-markdown";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { TPlantUmlElement } from "@/components/Editor/plugins/plantuml-plugin";

export interface INode extends Omit<MdMath, "type"> {
    value: string;
    type: "plantuml";
}

declare module "mdast" {
    interface RootContentMap {
        plantuml: INode;
    }
}

export const remark: Plugin = function () {
    return (tree: Node) => {
        visit(tree, "math", (node: MdMath, index: number, parent: Parent | undefined) => {
            if (node.meta !== "uml" || !parent || typeof index !== "number") {
                return;
            }

            parent.children.splice(index, 1, {
                ...node,
                type: "plantuml",
                value: node.value,
            });
        });
    };
};

export const rules = {
    plantuml: {
        deserialize: (node: INode): TPlantUmlElement => ({
            children: [{ text: "" }],
            type: "plantuml",
            umlCode: node.value,
        }),
        serialize: (node: TPlantUmlElement) => ({
            type: "math",
            meta: "uml",
            value: node.umlCode,
        }),
    },
};
