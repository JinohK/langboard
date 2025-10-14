"use client";

import type { Node, Parent } from "mdast";
import { MdMath } from "@platejs/markdown";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { PLANTUML_KEY, TPlantUmlElement } from "@/components/Editor/plugins/customs/plantuml/PlantUmlPlugin";

export interface IPlantUMLNode extends Omit<MdMath, "type"> {
    value: string;
    type: typeof PLANTUML_KEY;
}

declare module "mdast" {
    interface RootContentMap {
        plantuml: IPlantUMLNode;
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
                type: PLANTUML_KEY,
                value: node.value,
            });
        });
    };
};

export const rules = {
    plantuml: {
        deserialize: (node: IPlantUMLNode): TPlantUmlElement => ({
            children: [{ text: "" }],
            type: PLANTUML_KEY,
            umlCode: node.value,
        }),
        serialize: (node: TPlantUmlElement) => ({
            type: "math",
            meta: "uml",
            value: node.umlCode,
        }),
    },
};
