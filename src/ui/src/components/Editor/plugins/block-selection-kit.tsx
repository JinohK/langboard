/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BlockSelectionPlugin } from "@platejs/selection/react";
import { getPluginTypes, KEYS } from "platejs";
import { BlockSelection } from "@/components/plate-ui/block-selection";

export const BlockSelectionKit = [
    BlockSelectionPlugin.configure(({ editor }) => ({
        options: {
            enableContextMenu: true,
            isSelectable: (element, path) => {
                return (
                    !getPluginTypes(editor, [KEYS.column, KEYS.codeLine, KEYS.td]).includes(element.type) &&
                    !editor.api.block({ above: true, at: path, match: { type: "tr" } })
                );
            },
        },
        render: {
            belowRootNodes: (props) => {
                if (!props.attributes.className?.includes("slate-selectable")) return null;

                return <BlockSelection {...(props as any)} />;
            },
        },
    })),
];
