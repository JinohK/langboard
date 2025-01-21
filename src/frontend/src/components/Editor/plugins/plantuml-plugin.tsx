import TypeUtils from "@/core/utils/TypeUtils";
import { type InsertNodesOptions, type SlateEditor, type TElement, bindFirst, createSlatePlugin } from "@udecode/plate";
import { toPlatePlugin } from "@udecode/plate/react";
import PlantUMLEncoder from "plantuml-encoder";
import React from "react";

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
            type: editor.getType(BasePlantUmlPlugin),
        },
        options
    );
};

export const PlantUmlPlugin = toPlatePlugin(BasePlantUmlPlugin);

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
