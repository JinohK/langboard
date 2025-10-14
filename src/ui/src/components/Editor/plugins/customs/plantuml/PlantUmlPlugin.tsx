import { type InsertNodesOptions, type SlateEditor, type TElement, bindFirst, createSlatePlugin } from "platejs";
import { toPlatePlugin } from "platejs/react";
import PlantUMLEncoder from "plantuml-encoder";
import React from "react";
import { PlantUmlElement } from "@/components/plate-ui/plantuml-node";
import { Utils } from "@langboard/core/utils";

export const PLANTUML_KEY = "plantuml";

export interface TPlantUmlElement extends TElement {
    umlCode: string;
}

const BasePlantUmlPlugin = createSlatePlugin({
    key: PLANTUML_KEY,
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
        if (!umlCode || !Utils.Type.isString(umlCode)) {
            setSrc(null);
            return;
        }

        const encoded = PlantUMLEncoder.encode(umlCode.trim());
        const src = `http://www.plantuml.com/plantuml/svg/${encoded}`;

        setSrc(src);
    }, [umlCode]);

    return { src };
};
