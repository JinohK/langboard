import { SlateEditor } from "@udecode/plate";
import { deserializeInlineMd, deserializeMd, DeserializeMdOptions } from "@udecode/plate-markdown";

export const deserialize = (isInline: bool) => (editor: SlateEditor, text: string, options?: DeserializeMdOptions) => {
    // remove invalid html tags without valid html tags

    const HTML_TAGS = new Set([
        "a",
        "abbr",
        "address",
        "audio",
        "b",
        "bdi",
        "bdo",
        "big",
        "blockquote",
        "br",
        "callout",
        "caption",
        "cite",
        "code",
        "col",
        "colgroup",
        "date",
        "dd",
        "del",
        "details",
        "dfn",
        "div",
        "dl",
        "dt",
        "em",
        "figcaption",
        "figure",
        "font",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "i",
        "img",
        "ins",
        "kbd",
        "li",
        "mark",
        "math",
        "ol",
        "p",
        "picture",
        "pre",
        "q",
        "rp",
        "rt",
        "ruby",
        "samp",
        "small",
        "source",
        "span",
        "strong",
        "sub",
        "summary",
        "sup",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "time",
        "toc",
        "tr",
        "track",
        "u",
        "ul",
        "video",
        "wbr",
    ]);

    const tagLikeRegex = /(?<!\\)<[^>]+>/g;
    let lastIndex = 0;
    let match;
    let newText = "";

    while ((match = tagLikeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            newText += text.slice(lastIndex, match.index);
        }

        const tag = match[0];
        const tagName = tag.replace(/<|\/|>/g, "").split(" ")[0];

        if (HTML_TAGS.has(tagName)) {
            newText += tag;
            lastIndex = match.index + tag.length;
            continue;
        }

        const newTag = tag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        newText += newTag;
        lastIndex = match.index + tag.length;
    }

    newText = newText + text.slice(lastIndex);
    return isInline ? deserializeInlineMd(editor, newText, options) : deserializeMd(editor, newText, options);
};
