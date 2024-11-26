/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ILeafNode, IListNode, MdElementType, MdLeafType, TImgNode, TMentionNode } from "@/components/Editor/plugins/markdown/serializer/types";
import { TCodeBlockElement } from "@udecode/plate-code-block";
import { TDescendant, TElement } from "@udecode/plate-common";
import { ListStyleType } from "@udecode/plate-indent-list";
import { TLinkElement } from "@udecode/plate-link";

export const isLeafNode = (node: MdElementType | MdLeafType): node is MdLeafType => {
    return typeof (node as MdLeafType).text === "string";
};

export const isLeafElement = (node: MdElementType | MdLeafType): node is ILeafNode => {
    return isLeafNode(node);
};

export const isLink = (node: MdElementType | MdLeafType): node is TLinkElement => {
    return (node as any).type === "a";
};

export const isBlockQuote = (node: MdElementType | MdLeafType): node is TElement => {
    return (node as any).type === "blockquote";
};

export const isCodeBlock = (node: MdElementType | MdLeafType): node is TCodeBlockElement => {
    return (node as any).type === "code_block";
};

export const isHeading = (node: MdElementType | MdLeafType): node is TElement => {
    return ["h1", "h2", "h3", "h4", "h5", "h6"].includes((node as any).type);
};

export const isHorizontalLine = (node: MdElementType | MdLeafType): node is TElement => {
    return (node as any).type === "hr";
};

export const isImg = (node: MdElementType | MdLeafType): node is TImgNode => {
    return (node as any).type === "img";
};

export const isList = (node: MdElementType | MdLeafType): node is IListNode => {
    return typeof (node as any).listStyleType === "string";
};

export const isParagraph = (node: MdElementType | MdLeafType): node is TElement => {
    return (node as any).type === "p";
};

export const isMention = (node: MdElementType | MdLeafType): node is TMentionNode => {
    return (node as any).type === "mention";
};

export const nodeToHTML = (
    node: TDescendant,
    chunks: string[],
    opts: { closeTag: string; serialize: (node: MdElementType | MdLeafType) => string | undefined }
) => {
    if (opts.closeTag && (!isList(node) || (isList(node) && !node.listStart))) {
        chunks.push(`</${opts.closeTag}>`);
        opts.closeTag = "";
    }

    if (isLeafElement(node)) {
        let chunk = node.text;
        if (node.kbd) {
            chunk = `<kbd>${chunk}</kbd>`;
        }
        if (node.highlight) {
            chunk = `<mark>${chunk}</mark>`;
        }
        if (node.underline) {
            chunk = `<u>${chunk}</u>`;
        }
        if (node.superscript) {
            chunk = `<sup>${chunk}</sup>`;
        }
        if (node.subscript) {
            chunk = `<sub>${chunk}</sub>`;
        }
        if (node.strikethrough) {
            chunk = `<s>${chunk}</s>`;
        }
        if (node.italic) {
            chunk = `<em>${chunk}</em>`;
        }
        if (node.bold) {
            chunk = `<strong>${chunk}</strong>`;
        }
        chunks.push(chunk);
        return;
    }

    let closeTag = "";
    if (isLink(node)) {
        chunks.push(`<a href="${node.url}" target="${node.target}">`);
        closeTag = "a";
    } else if (isBlockQuote(node)) {
        chunks.push("<blockquote>");
        closeTag = "blockquote";
    } else if (isCodeBlock(node)) {
        chunks.push("<pre><code>");
        closeTag = "code></pre>";
    } else if (isHeading(node)) {
        chunks.push(`<${node.type}>`);
        closeTag = node.type;
    } else if (isHorizontalLine(node)) {
        chunks.push("<hr>");
        return;
    } else if (isImg(node)) {
        chunks.push(`<img src="${node.url}" alt="${node.caption?.map((c: MdElementType | MdLeafType) => opts.serialize(c)).join("")}">`);
        return;
    } else if (isList(node)) {
        if (node.listStyleType === ListStyleType.Decimal) {
            if (!node.listStart) {
                chunks.push("<ol>");
                opts.closeTag = "ol";
            }
        } else {
            if (!node.listStart) {
                chunks.push("<ul>");
                opts.closeTag = "ul";
            }
        }

        chunks.push(`<li>${"&nbsp;".repeat((node.listStart ?? 1) - 1)}`);
        closeTag = "li";
    } else if (isParagraph(node)) {
        chunks.push("<p>");
        closeTag = "p";
    } else {
        (node as unknown as TElement)?.children?.forEach?.((child) => nodeToHTML(child, chunks, { closeTag: "", serialize: opts.serialize }));
    }

    if (closeTag) {
        (node as TElement).children.forEach((child) => nodeToHTML(child, chunks, { closeTag: "", serialize: opts.serialize }));
        chunks.push(`</${closeTag}>`);
    }
};
