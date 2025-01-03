/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TDescendant, TElement, TText } from "@udecode/plate-common";
import type { MdastNode, RemarkElementRules } from "@/components/Editor/plugins/markdown/remark-slate/types";
import { MarkdownPlugin } from "@/components/Editor/plugins/markdown/MarkdownPlugin";
import { remarkTransformElementChildren } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformElementChildren";
import { remarkTransformNode } from "@/components/Editor/plugins/markdown/remark-slate/remarkTransformNode";

// FIXME: underline, not yet supported by remark-slate
export const remarkDefaultElementRules: RemarkElementRules = {
    blockquote: {
        transform: (node, options) => {
            const children = node.children?.length
                ? node.children.flatMap((paragraph) => remarkTransformElementChildren(paragraph, options))
                : [{ text: "" }];

            // Flatten nested blockquotes (e.g. >>>)
            const flattenedChildren = children.flatMap((child: any) => (child.type ? child.children : [child]));

            return {
                children: flattenedChildren,
                type: options.editor.getType({ key: "blockquote" }),
            };
        },
    },
    code: {
        transform: (node, options) => ({
            children: (node.value || "").split("\n").map((line) => ({
                children: [{ text: line } as TText],
                type: options.editor.getType({ key: "code_line" }),
            })),
            lang: node.lang ?? undefined,
            type: options.editor.getType({ key: "code_block" }),
        }),
    },
    heading: {
        transform: (node, options) => {
            const headingType = {
                1: "h1",
                2: "h2",
                3: "h3",
                4: "h4",
                5: "h5",
                6: "h6",
            }[node.depth ?? 1];

            return {
                children: remarkTransformElementChildren(node, options),
                type: options.editor.getType({ key: headingType }),
            };
        },
    },
    image: {
        transform: (node, options) => ({
            caption: [{ text: node.alt } as TText],
            children: [{ text: "" } as TText],
            type: options.editor.getType({ key: "img" }),
            url: node.url,
        }),
    },
    inlineMath: {
        transform: (node, options) => ({
            children: [{ text: "" }],
            texExpression: node.value,
            shouldNotOpenInit: true,
            type: options.editor.getType({ key: "inline_equation" }),
        }),
    },
    link: {
        transform: (node, options) => ({
            children: remarkTransformElementChildren(node, options),
            type: options.editor.getType({ key: "a" }),
            url: node.url,
        }),
    },
    list: {
        transform: (node, options) => {
            if (options.indentList) {
                const listStyleType = node.ordered ? "decimal" : "disc";

                const decimalStarts: number[] = [];

                const parseListItems = (_node: MdastNode, listItems: TElement[] = [], indent = 1) => {
                    _node.children?.forEach((listItem) => {
                        if (!listItem.children) {
                            listItems.push({
                                children: remarkTransformElementChildren(listItem, options),
                                type: options.editor.getType({ key: "p" }),
                            });

                            return listItems;
                        }

                        const [paragraph, ...subLists] = listItem.children;

                        listItems.push({
                            children: remarkTransformElementChildren(paragraph || "", options),
                            indent,
                            listStyleType,
                            type: options.editor.getType({ key: "p" }),
                            listStart: listStyleType === "decimal" ? decimalStarts[indent] : undefined,
                        });

                        if (listStyleType === "decimal") {
                            if (!decimalStarts[indent]) {
                                decimalStarts[indent] = 2;
                            } else {
                                ++decimalStarts[indent];
                            }
                        }

                        subLists.forEach((subList) => {
                            if (subList.type === "list") {
                                parseListItems(subList, listItems, indent + 1);
                            } else {
                                const result = remarkTransformNode(subList, options) as TElement | TElement[];

                                if (Array.isArray(result)) {
                                    listItems.push(...result.map((v) => ({ ...v, indent: indent + 1 })));
                                } else {
                                    listItems.push({ ...result, indent: indent + 1 });
                                }
                            }
                        });
                    });

                    return listItems;
                };

                return parseListItems(node);
            }

            return {
                children: remarkTransformElementChildren(node, options),
                type: options.editor.getType({ key: node.ordered ? "ol" : "ul" }),
            };
        },
    },
    listItem: {
        transform: (node, options) => ({
            children: remarkTransformElementChildren(node, options).map(
                (child) =>
                    ({
                        ...child,
                        type: child.type === options.editor.getType({ key: "p" }) ? options.editor.getType({ key: "lic" }) : child.type,
                    }) as TDescendant
            ),
            type: options.editor.getType({ key: "li" }),
        }),
    },
    math: {
        transform: (node, options) => ({
            children: [{ text: "" }],
            texExpression: node.value,
            shouldNotOpenInit: true,
            type: options.editor.getType({ key: "equation" }),
        }),
    },
    paragraph: {
        transform: (node, options) => {
            const isKeepLineBreak = options.editor.getOptions(MarkdownPlugin).splitLineBreaks;

            const children = remarkTransformElementChildren(node, options);

            const elements: TElement[] = [];

            if (children.length === 1 && ["audio", "video"].includes(children[0].type as string)) {
                elements.push(children[0] as TElement, {
                    children: [{ text: "" }],
                    type: options.editor.getType({ key: "p" }),
                });

                return elements;
            }

            const paragraphType = options.editor.getType({ key: "p" });
            const splitBlockTypes = new Set([options.editor.getType({ key: "img" })]);

            let inlineNodes: TDescendant[] = [];

            const flushInlineNodes = () => {
                if (inlineNodes.length > 0) {
                    elements.push({
                        children: inlineNodes,
                        type: paragraphType,
                    });

                    inlineNodes = [];
                }
            };

            children.forEach((child) => {
                const { type } = child;

                if (type && splitBlockTypes.has(type as string)) {
                    flushInlineNodes();
                    elements.push(child as TElement);
                } else if (isKeepLineBreak && "text" in child && typeof child.text === "string") {
                    // Handle line break generated by <br>
                    const isSingleLineBreak = child.text === "\n" && inlineNodes.length === 0;

                    if (isSingleLineBreak) {
                        inlineNodes.push({ ...child, text: "" });
                        flushInlineNodes();

                        return;
                    }

                    // Handle text containing line breaks
                    const textParts = child.text.split("\n");

                    textParts.forEach((part, index, array) => {
                        const isNotFirstPart = index > 0;
                        const isNotLastPart = index < array.length - 1;

                        // Create new paragraph for non-first parts
                        if (isNotFirstPart) {
                            flushInlineNodes();
                        }
                        // Only add non-empty text
                        if (part) {
                            inlineNodes.push({ ...child, text: part });
                        }
                        // Create paragraph break for non-last parts
                        if (isNotLastPart) {
                            flushInlineNodes();
                        }
                    });
                } else {
                    inlineNodes.push(child);
                }
            });

            flushInlineNodes();

            return elements;
        },
    },
    table: {
        transform: (node, options) => {
            const rows =
                node.children?.map((row, rowIndex) => {
                    return {
                        children:
                            row.children?.map((cell) => {
                                const cellType = rowIndex === 0 ? "th" : "td";

                                return {
                                    children: remarkTransformElementChildren(cell, options).map((child) => {
                                        if (!child.type) {
                                            return {
                                                children: [child],
                                                type: options.editor.getType({ key: "p" }),
                                            };
                                        }

                                        return child;
                                    }),
                                    type: options.editor.getType({ key: cellType }),
                                };
                            }) || [],
                        type: options.editor.getType({ key: "tr" }),
                    };
                }) || [];

            return {
                children: rows,
                type: options.editor.getType({ key: "table" }),
            };
        },
    },
    thematicBreak: {
        transform: (_, options) => ({
            children: [{ text: "" } as TText],
            type: options.editor.getType({ key: "hr" }),
        }),
    },
};
