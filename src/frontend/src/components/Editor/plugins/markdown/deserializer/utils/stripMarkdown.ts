export const stripMarkdownBlocks = (text: string) => {
    // Remove headers
    text = text.replace(/^#{1,6}\s+/gm, "");

    // Remove blockquotes
    text = text.replace(/^\s*>\s?/gm, "");

    // Remove horizontal rules
    text = text.replace(/^([*_-]){3,}\s*$/gm, "");

    // Remove list symbols
    text = text.replace(/^(\s*)([*+-]|\d+\.)\s/gm, "$1");

    // Remove code blocks
    text = text.replace(/^```[\S\s]*?^```/gm, "");

    // Replace <br> with \n
    text = text.replace(/<br>/g, "\n");

    return text;
};

export const stripMarkdownInline = (text: string) => {
    // Remove emphasis (bold, italic)
    text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");

    // Remove links
    text = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1");

    // Remove inline code
    text = text.replace(/`(.+?)`/g, "$1");

    // Replace HTML entities
    text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/&amp;/g, "&");

    return text;
};

export const stripMarkdown = (text: string) => {
    text = stripMarkdownBlocks(text);
    text = stripMarkdownInline(text);

    // Remove HTML tags (including <br>)
    // text = text.replace(/<[^>]*>/g, '');

    // Replace HTML entities
    // text = text.replace('&nbsp;', ' ');
    // text = text.replace('&lt;', '<');
    // text = text.replace('&gt;', '>');
    // text = text.replace('&amp;', '&');

    return text;
};
