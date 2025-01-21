import { splitDataText } from "@/components/Editor/plugins/markdown/remark-slate/remarkDataText";
import type { MdastNode, RemarkDataTextRules, RemarkPluginOptions } from "@/components/Editor/plugins/markdown/remark-slate/types";
import { Descendant, TText } from "@udecode/plate";
import { remarkTransformNode } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformNode";
import TypeUtils from "@/core/utils/TypeUtils";

const transformChunk = (node: MdastNode, value: string, opts: RemarkPluginOptions) => {
    const transformed = remarkTransformNode(
        {
            ...node,
            type: "text",
            value,
        },
        opts
    );

    if (!TypeUtils.isArray(transformed)) {
        return [transformed];
    } else {
        return transformed;
    }
};

const makeDataTextNodes = (
    node: MdastNode,
    splittedDataText: ReturnType<typeof splitDataText>,
    opts: RemarkPluginOptions,
    transformedNode: Descendant
): Descendant[] => {
    return [...transformChunk(node, splittedDataText.leftChunk, opts), transformedNode, ...transformChunk(node, splittedDataText.rightChunk, opts)];
};

export const remarkDefaultDataTextRules: RemarkDataTextRules = {
    audio: {
        transform: (node, opts) => {
            if (!node.value) {
                return undefined;
            }

            const splittedDataText = splitDataText("audio", node.value);

            if (splittedDataText.dataChunk.params.length !== 2 || !splittedDataText.dataChunk.value.length) {
                return undefined;
            }

            const url = `${splittedDataText.dataChunk.params[0]}://${splittedDataText.dataChunk.params[1]}${splittedDataText.dataChunk.value}`;

            return [
                {
                    children: [{ text: "" } as TText],
                    type: opts.editor.getType({ key: "audio" }),
                    url,
                },
            ];
        },
    },
    date: {
        transform: (node, opts) => {
            if (!node.value) {
                return undefined;
            }

            const splittedDataText = splitDataText("date", node.value);

            if (splittedDataText.dataChunk.params.length !== 1) {
                return undefined;
            }

            return makeDataTextNodes(node, splittedDataText, opts, {
                children: [{ text: "" } as TText],
                date: splittedDataText.dataChunk.params[0],
                type: opts.editor.getType({ key: "date" }),
            });
        },
    },
    file: {
        transform: (node, opts) => {
            if (!node.value) {
                return undefined;
            }

            const splittedDataText = splitDataText("file", node.value);

            if (splittedDataText.dataChunk.params.length !== 3 || !splittedDataText.dataChunk.value.length) {
                return undefined;
            }

            const url = `${splittedDataText.dataChunk.params[0]}://${splittedDataText.dataChunk.params[1]}${splittedDataText.dataChunk.params[2]}`;

            return [
                {
                    children: [{ text: "" } as TText],
                    type: opts.editor.getType({ key: "file" }),
                    isUpload: true,
                    name: splittedDataText.dataChunk.value,
                    url,
                },
            ];
        },
    },
    mention: {
        transform: (node, opts) => {
            if (!node.value) {
                return undefined;
            }

            const splittedDataText = splitDataText("mention", node.value);

            if (splittedDataText.dataChunk.params.length !== 2) {
                return undefined;
            }

            return makeDataTextNodes(node, splittedDataText, opts, {
                children: [{ text: "" } as TText],
                key: splittedDataText.dataChunk.params[0],
                value: splittedDataText.dataChunk.params[1],
                type: opts.editor.getType({ key: "mention" }),
            });
        },
    },
    video: {
        transform: (node, opts) => {
            if (!node.value) {
                return undefined;
            }

            const splittedDataText = splitDataText("video", node.value);

            if (splittedDataText.dataChunk.params.length !== 2 || !splittedDataText.dataChunk.value.length) {
                return undefined;
            }

            const url = `${splittedDataText.dataChunk.params[0]}://${splittedDataText.dataChunk.params[1]}${splittedDataText.dataChunk.value}`;

            return [
                {
                    children: [{ text: "" } as TText],
                    type: opts.editor.getType({ key: "video" }),
                    url,
                },
            ];
        },
    },
};
