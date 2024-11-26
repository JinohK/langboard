import type { RemarkTextRules } from "@/components/Editor/plugins/markdown/remark-slate/types";
import { SlateEditor } from "@udecode/plate-common";

const HTML_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9_-]*)\b[^>]*>(.*?)<\/\1>/g;

export const remarkDefaultTextRules: RemarkTextRules = {
    delete: { mark: ({ editor }) => editor.getType({ key: "strikethrough" }) },
    emphasis: { mark: ({ editor }) => editor.getType({ key: "italic" }) },
    highlight: { mark: ({ editor }) => editor.getType({ key: "highlight" }), transform: (text: string) => text.replace(/≡/g, "") },
    html: {
        transform: (text) => text.replace(/<br>/g, "\n"),
        parseData: (text, { editor }) => {
            const parsedData: Record<string, unknown> = {};
            parsedData.text = remarkHtmlRecursive(text, parsedData, { editor });
            return parsedData;
        },
    },
    inlineCode: { mark: ({ editor }) => editor.getType({ key: "code" }) },
    strong: { mark: ({ editor }) => editor.getType({ key: "bold" }) },
    text: {},
};

const remarkHtmlRecursive = (text: string, parsedData: Record<string, unknown>, { editor }: { editor: SlateEditor }) => {
    if (!HTML_TAG_REGEX.test(text)) {
        return text;
    }

    text = text.replace(HTML_TAG_REGEX, (_, tag, value) => {
        switch (tag) {
            case "sub":
                parsedData[editor.getType({ key: "subscript" })] = true;
                break;
            case "sup":
                parsedData[editor.getType({ key: "superscript" })] = true;
                break;
            case "u":
                parsedData[editor.getType({ key: "underline" })] = true;
                break;
        }

        return value;
    });

    return remarkHtmlRecursive(text, parsedData, { editor });
};
