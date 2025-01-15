/* eslint-disable @typescript-eslint/no-explicit-any */
import { TDataType } from "@/components/Editor/plugins/markdown/remark-slate/remarkDataText";
import type { SlateEditor, TDescendant, TElement } from "@udecode/plate-common";

export type MdastElementType =
    | "audio"
    | "blockquote"
    | "code"
    | "date"
    | "file"
    | "heading"
    | "image"
    | "inlineMath"
    | "link"
    | "list"
    | "listItem"
    | "math"
    | "mention"
    | "paragraph"
    | "table"
    | "thematicBreak"
    | "video";

export type MdastTextType = "delete" | "emphasis" | "highlight" | "html" | "inlineCode" | "strong" | "text";

export type MdastNodeType = MdastElementType | MdastTextType;

export interface TextPosition {
    column: number;
    line: number;
    offset?: number;
}

export interface MdastNode {
    type: MdastNodeType;
    // mdast metadata
    position?: {
        end: TextPosition;
        start: TextPosition;
    };
    alt?: string;
    checked?: any;
    children?: MdastNode[];
    depth?: 1 | 2 | 3 | 4 | 5 | 6;
    indent?: any;
    lang?: string;
    ordered?: bool;
    spread?: any;
    text?: string;
    url?: string;
    value?: string;
    meta?: string;
}

export type RemarkElementRule = {
    transform: (node: MdastNode, options: RemarkPluginOptions) => TElement | TElement[];
};

export type RemarkElementRules = {
    [key in MdastElementType]?: RemarkElementRule;
};

export type RemarkTextRule = {
    mark?: (options: RemarkPluginOptions) => string;
    transform?: (text: string) => string;
    parseData?: (text: string, options: RemarkPluginOptions) => Record<string, any>;
};

export type RemarkTextRules = {
    [key in MdastTextType]?: RemarkTextRule;
};

export type RemarkDataTextRule = {
    transform: (node: MdastNode, options: RemarkPluginOptions, inheritedMarkProps: Record<string, bool>) => TDescendant[] | undefined;
};

export type RemarkDataTextRules = {
    [key in TDataType]?: RemarkDataTextRule;
};

export type RemarkPluginOptions = {
    editor: SlateEditor;
    elementRules: RemarkElementRules;
    textRules: RemarkTextRules;
    dataTextRules: RemarkDataTextRules;
    indentList?: bool;
};
