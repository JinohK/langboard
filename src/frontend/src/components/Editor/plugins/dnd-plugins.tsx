/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type Descendant, ElementApi, queryNode } from "@udecode/plate";
import { DndPlugin } from "@udecode/plate-dnd";
import { PlaceholderPlugin } from "@udecode/plate-media/react";
import { NodeIdPlugin } from "@udecode/plate-node-id";
import { DraggableAboveNodes } from "@/components/plate-ui/draggable";

export const dndPlugins = [
    NodeIdPlugin.configure({
        normalizeInitialValue: ({ editor, getOptions }) => {
            const { allow, exclude, filter, filterInline, filterText, idKey, normalizeInitialValue } = getOptions();

            // Perf: check if normalization is needed by looking at the first node and last node
            if (!normalizeInitialValue) {
                const firstNode = editor.children[0];
                const lastNode = editor.children.at(-1);

                if (firstNode?.id && lastNode?.id) {
                    return;
                }
            }

            const addNodeId = (entry: [Descendant, number[]]) => {
                const [node, path] = entry;

                if (
                    !node[idKey!] &&
                    queryNode([node, path], {
                        allow,
                        exclude,
                        filter: (entry) => {
                            const [node] = entry;

                            if (filterText && !ElementApi.isElement(node)) {
                                return false;
                            }
                            if (filterInline && ElementApi.isElement(node) && !editor.api.isBlock(node)) {
                                return false;
                            }

                            return filter!(entry);
                        },
                    })
                ) {
                    editor.tf.setNodes({
                        [idKey!]: getOptions().idCreator!(),
                    });
                }
                // Process children in place if they exist
                if ((node.children as any)?.length > 0) {
                    (node.children as any).forEach((child: any, index: number) => {
                        addNodeId([child, [...path, index]]);
                    });
                }

                return node;
            };

            // Process top-level nodes in place
            editor.children.forEach((node, index) => {
                addNodeId([node, [index]]);
            });
        },
    }),
    DndPlugin.configure({
        options: {
            enableScroller: true,
            onDropFiles: ({ dragItem, editor, target }) => {
                editor.getTransforms(PlaceholderPlugin).insert.media(dragItem.files, { at: target, nextBlock: false });
            },
        },
        render: {
            aboveNodes: DraggableAboveNodes,
        },
    }),
] as const;
