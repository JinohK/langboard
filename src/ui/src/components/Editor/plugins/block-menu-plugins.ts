"use client";

import { BlockMenuPlugin } from "@udecode/plate-selection/react";
import { BlockContextMenu } from "@/components/plate-ui/block-context-menu";
import { blockSelectionPlugins } from "@/components/Editor/plugins/block-selection-plugins";

export const blockMenuPlugins = [
    ...blockSelectionPlugins,
    BlockMenuPlugin.configure({
        render: { aboveEditable: BlockContextMenu },
    }),
] as const;
