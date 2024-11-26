import type { MdElementType, MdLeafType } from "@/components/Editor/plugins/markdown/serializer/types";

import { type SerializeMdOptions, serializeMdNode } from "@/components/Editor/plugins/markdown/serializer/serializeMdNode";
import { TTableCellElement, TTableElement, TTableRowElement } from "@udecode/plate-table";
import { isLeafNode, nodeToHTML } from "@/components/Editor/plugins/markdown/serializer/utils";
import { createDataText } from "@/components/Editor/plugins/markdown/remark-slate";
import { format as formatDate } from "date-fns";

export const defaultSerializeMdNodesOptions: SerializeMdOptions["nodes"] = {
    a: {
        serialize: (children, node) => {
            return `[${children}](${node.url || ""})`;
        },
        type: "a",
    },
    audio: {
        isVoid: true,
        serialize: (children, node) => {
            if (!node.url) {
                return children;
            }

            const url = new URL(node.url);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return children;
            }

            const protocol = url.protocol.replace(":", "");
            const host = url.host;
            const path = url.pathname;

            return `\n${createDataText("audio", [protocol, host], path)}\n`;
        },
        type: "audio",
    },
    blockquote: {
        serialize: (children) => `\n> ${children}\n`,
        type: "blockquote",
    },
    bold: {
        isLeaf: true,
        type: "bold",
    },
    code: { isLeaf: true, type: "code" },
    code_block: {
        serialize: (children, node) => `\n\`\`\`${node.lang || ""}\n${children}\n\`\`\`\n`,
        type: "code_block",
    },
    date: {
        serialize: (children, node) => {
            if (!node.date) {
                return children;
            }

            const date = new Date(node.date);
            const formattedDate = formatDate(date, "yyyy-MM-dd");
            return createDataText("date", [formattedDate]);
        },
        type: "date",
    },
    equation: {
        serialize: (_, node) => {
            return `\n$$\n${node.texExpression}\n$$\n`;
        },
        type: "equation",
    },
    file: {
        isVoid: true,
        serialize: (children, node) => {
            if (!node.url) {
                return children;
            }

            const url = new URL(node.url);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return children;
            }

            const protocol = url.protocol.replace(":", "");
            const host = url.host;
            const path = url.pathname;

            return `\n${createDataText("file", [protocol, host, path], node.name)}\n`;
        },
        type: "file",
    },
    h1: { serialize: (children) => `\n# ${children}\n`, type: "h1" },
    h2: { serialize: (children) => `\n## ${children}\n`, type: "h2" },
    h3: { serialize: (children) => `\n### ${children}\n`, type: "h3" },
    h4: { serialize: (children) => `\n#### ${children}\n`, type: "h4" },
    h5: {
        serialize: (children) => `\n##### ${children}\n`,
        type: "h5",
    },
    h6: {
        serialize: (children) => `\n###### ${children}\n`,
        type: "h6",
    },
    highlight: {
        isLeaf: true,
        type: "highlight",
    },
    hr: { isVoid: true, serialize: () => "\n---\n", type: "hr" },
    img: {
        isVoid: true,
        serialize: (_, node, opts) => {
            const caption = node.caption?.map((c: MdElementType | MdLeafType) => serializeMdNode(c, opts)).join("") ?? "";

            return `\n![${caption}](${node.url || ""})\n`;
        },
        type: "img",
    },
    inline_equation: {
        serialize: (_, node) => {
            return `$$${node.texExpression?.replace(/\n/g, "") ?? ""}$$`;
        },
        type: "inline_equation",
    },
    italic: { isLeaf: true, type: "italic" },
    li: {
        serialize: (children, node, { listDepth = 0, nodes }) => {
            const isOL = node && node.parent?.type === nodes.ol.type;

            const spacer = "    ".repeat(listDepth);

            const isNewLine = node && (node.parent?.type === nodes.ol.type || node.parent?.type === nodes.ul.type);
            const emptyBefore = isNewLine ? "\n" : "";

            //   const isLastItem =
            //     node.parent &&
            //     node.parent.length! - 1 === node.parent.index &&
            //     node.children.length === 1;
            //   const emptyAfter = isLastItem && listDepth === 0 ? '\n' : '';

            return `${emptyBefore}${spacer}${isOL ? "1." : "-"} ${children}`;
        },
        type: "li",
    },
    kbd: {
        serialize: (children) => {
            return `<kbd>${children}</kbd>`;
        },
        type: "kbd",
    },
    mention: {
        serialize: (_, node) => {
            return createDataText("mention", [node.key!, node.value!]);
        },
        type: "mention",
    },
    ol: {
        serialize: (children, _, { listDepth }) => {
            const newLineAfter = listDepth === 0 ? "\n" : "";

            return `${children}${newLineAfter}`;
        },
        type: "ol",
    },
    p: {
        serialize: (children, node, { ulListStyleTypes = [] }) => {
            const listStyleType = node.listStyleType;

            if (listStyleType) {
                let pre = "";

                // Decrement indent for indent lists
                const listDepth = node.indent ? node.indent - 1 : 0;

                pre += "  ".repeat(listDepth);

                const listStart = node.listStart ?? 1;

                const isOL = !ulListStyleTypes.includes(listStyleType);
                const treatAsLeaf = node.children.length === 1 && isLeafNode(node.children[0]);

                // https://github.com/remarkjs/remark-react/issues/65
                if (isOL && listDepth > 0) {
                    pre += " ";
                }

                let todoChecker = "";
                if (listStyleType === "todo") {
                    if (node.checked) {
                        todoChecker = " [x]";
                    } else {
                        todoChecker = " []";
                    }
                }

                // TODO: support all styles
                return `${pre}${isOL ? listStart + "." : "-"}${todoChecker} ${children}${treatAsLeaf ? "\n" : ""}`;
            }

            return `\n${children}\n`;
        },
        type: "p",
    },
    strikethrough: { isLeaf: true, type: "strikethrough" },
    subscript: { isLeaf: true, type: "subscript" },
    superscript: { isLeaf: true, type: "superscript" },
    ul: {
        serialize: (children, _, { listDepth }) => {
            const newLineAfter = listDepth === 0 ? "\n" : "";

            return `${children}${newLineAfter}`;
        },
        type: "ul",
    },
    underline: { isLeaf: true, type: "underline" },
    table: {
        serialize: (_, node, opts) => {
            const tableHtmlChunks = ["<table>"];
            let tableMarkdown = "";
            let isMarkdown = true;
            (node as unknown as TTableElement).children.forEach((row, i) => {
                const rowHtmlChunks = ["<tr>"];
                let rowMarkdown = "|";
                (row as TTableRowElement).children.forEach((cell) => {
                    if (isMarkdown && (((cell as TTableCellElement).colSpan ?? 1) > 1 || ((cell as TTableCellElement).rowSpan ?? 1) > 1)) {
                        isMarkdown = false;
                    }

                    const cellHtmlChunks = ["<td>"];
                    const cellMarkdown = serializeMdNode(cell, opts)?.replace(/\n/g, "");

                    rowMarkdown = `${rowMarkdown}${cellMarkdown ?? "&nbsp;"}|`;
                    nodeToHTML(cell, cellHtmlChunks, { closeTag: "", serialize: (node) => serializeMdNode(node, opts) });
                    cellHtmlChunks.push("</td>");

                    rowHtmlChunks.push(...cellHtmlChunks);
                });

                rowMarkdown = `${rowMarkdown}\n`;
                if (isMarkdown && i === 0) {
                    rowMarkdown = `${rowMarkdown}|${"-----|".repeat((row.children as unknown[]).length)}\n`;
                }
                tableMarkdown = `${tableMarkdown}${rowMarkdown}`;
            });

            if (isMarkdown) {
                return tableMarkdown;
            } else {
                return tableHtmlChunks.join("");
            }
        },
        type: "table",
    },
    video: {
        isVoid: true,
        serialize: (children, node) => {
            if (!node.url) {
                return children;
            }

            const url = new URL(node.url);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return children;
            }

            const protocol = url.protocol.replace(":", "");
            const host = url.host;
            const path = url.pathname;

            return `\n${createDataText("audio", [protocol, host], path)}\n`;
        },
        type: "video",
    },
};
