import type { TDescendant } from "@udecode/plate-common";
import type { PlateEditor } from "@udecode/plate-common/react";

import { MarkdownPlugin } from "@/components/Editor/plugins/markdown/MarkdownPlugin";
import { stripMarkdownBlocks } from "@/components/Editor/plugins/markdown/deserializer/utils/stripMarkdown";

export const deserializeInlineMd = (editor: PlateEditor, text: string) => {
    const leadingSpaces = /^\s*/.exec(text)?.[0] || "";
    const trailingSpaces = /\s*$/.exec(text)?.[0] || "";

    const strippedText = stripMarkdownBlocks(text.trim());

    const fragment: TDescendant[] = [];

    if (leadingSpaces) {
        fragment.push({ text: leadingSpaces });
    }
    if (strippedText) {
        fragment.push(...editor.getApi(MarkdownPlugin).markdown.deserialize(strippedText)[0].children);
    }
    if (trailingSpaces) {
        fragment.push({ text: trailingSpaces });
    }

    return fragment;
};
