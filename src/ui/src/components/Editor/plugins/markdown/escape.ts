import { SlateEditor } from "platejs";
import { deserializeInlineMd, deserializeMd, DeserializeMdOptions } from "@platejs/markdown";

const escapeNonHtmlAngles = (str: string): string => {
    const htmlTagRegex = /^<\/?[a-zA-Z][\w:-]*(\s+[a-zA-Z_:][\w:.-]*(\s*=\s*(".*?"|'.*?'|[^'"<>\s]+))?)*\s*\/?>/;
    let result = "";
    let i = 0;

    while (i < str.length) {
        const char = str[i];

        if (char === "<") {
            let slashCount = 0;
            for (let j = i - 1; j >= 0 && str[j] === "\\"; j--) slashCount++;
            const isEscaped = slashCount % 2 === 1;

            const remaining = str.slice(i);
            const match = remaining.match(htmlTagRegex);

            if (!isEscaped && match) {
                const tagMatch = match[0];
                result += tagMatch;
                i += tagMatch.length;
            } else if (!isEscaped) {
                result += "&lt;";
                i++;
            } else {
                result += char;
                i++;
            }
        } else if (char === ">") {
            let slashCount = 0;
            for (let j = i - 1; j >= 0 && str[j] === "\\"; j--) slashCount++;
            const isEscaped = slashCount % 2 === 1;

            if (!isEscaped) {
                result += "&gt;";
            } else {
                result += char;
            }
            i++;
        } else {
            result += char;
            i++;
        }
    }

    return result;
};

const splitMathBlocks = (text: string): { isMath: boolean; content: string }[] => {
    const blocks: { isMath: boolean; content: string }[] = [];
    const mathBlockRegex = /(```math[\s\S]*?```|\$\$[\s\S]*?\$\$)/g;
    let lastIndex = 0;
    let match;

    while ((match = mathBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            blocks.push({
                isMath: false,
                content: text.slice(lastIndex, match.index),
            });
        }

        blocks.push({
            isMath: true,
            content: match[0],
        });

        lastIndex = mathBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        blocks.push({
            isMath: false,
            content: text.slice(lastIndex),
        });
    }

    return blocks;
};

export const deserialize = (isInline: boolean) => (editor: SlateEditor, text: string, options?: DeserializeMdOptions) => {
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

    const escapeNonMathContent = (text: string): string => {
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

        newText += text.slice(lastIndex);
        return escapeNonHtmlAngles(newText);
    };

    // math block 단위로 나눠서 처리
    const segments = splitMathBlocks(text);
    const processed = segments.map(({ isMath, content }) => (isMath ? content : escapeNonMathContent(content))).join("");

    return isInline ? deserializeInlineMd(editor, processed, options) : deserializeMd(editor, processed, options);
};
