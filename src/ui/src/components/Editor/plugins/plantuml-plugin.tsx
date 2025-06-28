import TypeUtils from "@/core/utils/TypeUtils";
import { type InsertNodesOptions, type SlateEditor, type TElement, bindFirst, createSlatePlugin } from "platejs";
import { toPlatePlugin } from "platejs/react";
import PlantUMLEncoder from "plantuml-encoder";
import React from "react";
import { PlantUmlElement } from "@/components/plate-ui/plantuml-element";

export interface TPlantUmlElement extends TElement {
    umlCode: string;
}

const BasePlantUmlPlugin = createSlatePlugin({
    key: "plantuml",
    node: { isElement: true, isVoid: true },
}).extendEditorTransforms(({ editor }) => ({
    insert: {
        equation: bindFirst(insertPlantUML, editor),
    },
}));

export const insertPlantUML = (editor: SlateEditor, options?: InsertNodesOptions) => {
    editor.tf.insertNodes(
        {
            children: [{ text: "" }],
            umlCode: "",
            type: editor.getType(BasePlantUmlPlugin.key),
        },
        options
    );
};

export const PlantUmlPlugin = toPlatePlugin(BasePlantUmlPlugin).configure({
    node: {
        component: PlantUmlElement,
    },
});

export const usePlantUmlElement = ({ umlCode }: { umlCode?: string }) => {
    const [src, setSrc] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!umlCode || !TypeUtils.isString(umlCode)) {
            setSrc(null);
            return;
        }

        const encoded = PlantUMLEncoder.encode(umlCode.trim());
        const src = `http://www.plantuml.com/plantuml/svg/${encoded}`;

        setSrc(src);
    }, [umlCode]);

    return { src };
};
