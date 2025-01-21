import { TElement } from "@udecode/plate";
import { ListStyleType } from "@udecode/plate-indent-list";
import { TMentionElement } from "@udecode/plate-mention";

export type MdNodeTypes = {
    a: string;
    audio: string;
    blockquote: string;
    bold: string;
    code: string;
    date: string;
    equation: string;
    file: string;
    highlight: string;
    code_block: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    hr: string;
    img: string;
    inline_equation: string;
    italic: string;
    kbd: string;
    mention: string;
    li: string;
    ol: string;
    p: string;
    plantuml: string;
    strikethrough: string;
    subscript: string;
    superscript: string;
    ul: string;
    underline: string;
    table: string;
    video: string;
};

type NodeType = {
    parent?: {
        type: string;
        index?: number;
        isList?: bool;
        length?: number;
    };
};

export interface MdLeafType extends NodeType {
    text: string;
}

export interface MdElementType extends NodeType {
    children: (MdElementType | MdLeafType)[];
    type: string;
    break?: bool;
    caption?: (MdElementType | MdLeafType)[];
    indent?: number;
    lang?: string;
    listStart?: number;
    listStyleType?: string;
    checked?: bool;
    url?: string;
    key?: string;
    value?: string;
    date?: string;
    name?: string;
    texExpression?: string;
    umlCode?: string;
}

export interface ILeafNode {
    text: string;
    bold?: bool;
    code?: bool;
    italic?: bool;
    strikethrough?: bool;
    subscript?: bool;
    superscript?: bool;
    underline?: bool;
    kbd?: bool;
    highlight?: bool;
}

export type MdNodeType = MdElementType & MdLeafType & Record<string, unknown>;

export interface TImgNode extends TElement {
    id: string;
    name?: string;
    type: "img";
    url: string;
    caption?: (MdElementType | MdLeafType)[];
}

export interface IListNode extends TElement {
    id: string;
    index: number;
    listStyleType: ListStyleType;
    type: string;
    listStart?: number;
}

export interface TMentionNode extends TMentionElement {
    id: string;
    key: string;
    type: "mention";
}
