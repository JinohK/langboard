import { BaseListPlugin } from "@platejs/list";
import { KEYS } from "platejs";
import { BaseIndentKit } from "@/components/Editor/plugins/indent-base-kit";
import { BlockListStatic } from "@/components/plate-ui/block-list-static";

export const BaseListKit = [
    ...BaseIndentKit,
    BaseListPlugin.configure({
        inject: {
            targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock],
        },
        render: {
            belowNodes: BlockListStatic,
        },
    }),
];
