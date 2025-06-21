"use client";

import { BasicElementsPlugin } from "@udecode/plate-basic-elements/react";
import { BasicMarksPlugin } from "@udecode/plate-basic-marks/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin } from "@udecode/plate-code-block/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { all, createLowlight } from "lowlight";

import "@/assets/styles/editor-code-block.scss";

const lowlight = createLowlight(all);

export const basicNodesPlugins = [
    HeadingPlugin.configure({ options: { levels: 3 } }),
    BlockquotePlugin,
    BasicElementsPlugin.configurePlugin(CodeBlockPlugin, {
        options: {
            lowlight,
        },
    }),
    BasicMarksPlugin,
] as const;
