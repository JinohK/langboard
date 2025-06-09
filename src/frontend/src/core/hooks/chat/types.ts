/* eslint-disable @typescript-eslint/no-explicit-any */
export type TChatMessage = {
    text: string;
    template?: string;
    files?: Array<{ path: string; type: string; name: string } | string>;
    prompt?: string;
    id: string;
    timestamp: string;
    sender?: string;
    sender_name?: string;
    session_id?: string;
    edit?: bool;
    error?: bool;
    category?: string;
    properties?: TProperties;
    content_blocks?: IContentBlock[];
};

export type TSource = {
    id?: string;
    display_name?: string;
    source?: string;
};

export type TProperties = {
    source: TSource;
    icon?: string;
    background_color?: string;
    text_color?: string;
    targets?: string[];
    edited?: bool;
    allow_markdown?: bool;
    state?: "complete" | "partial";
    positive_feedback?: bool | null;
};

export interface IContentBlock {
    title: string;
    contents: TContent[];
    allow_markdown: bool;
    media_url?: string[];
    component: string;
}

// Base content type
export interface IBaseContent {
    type: string;
    duration?: number;
    header?: {
        title?: string;
        icon?: string;
    };
}

// Individual content types
export interface IErrorContent extends IBaseContent {
    type: "error";
    component?: string;
    field?: string;
    reason?: string;
    solution?: string;
    traceback?: string;
}

export interface ITextContent extends IBaseContent {
    type: "text";
    text: string;
}

export interface IMediaContent extends IBaseContent {
    type: "media";
    urls: string[];
    caption?: string;
}

export interface IJSONContent extends IBaseContent {
    type: "json";
    data: Record<string, any>;
}

export interface ICodeContent extends IBaseContent {
    type: "code";
    code: string;
    language: string;
    title?: string;
}

export interface IToolContent extends IBaseContent {
    type: "tool_use";
    name?: string;
    tool_input: Record<string, any>;
    output?: any;
    error?: any;
}

// Union type for all content types
export type TContent = IErrorContent | ITextContent | IMediaContent | IJSONContent | ICodeContent | IToolContent;

export type TChatOutput = {
    message: string;
    sender: string;
    sender_name: string;
    stream_url?: string;
    files?: Array<{ path: string; type: string; name: string }>;
};

export type TChatInput = {
    message: string;
    sender: string;
    sender_name: string;
    stream_url?: string;
    files?: Array<{ path: string; type: string; name: string }>;
};

export type TVertexBuildData = {
    id: string;
    inactivated_vertices: Array<string> | null;
    next_vertices_ids: Array<string>;
    top_level_vertices: Array<string>;
    run_id?: string;
    valid: bool;
    data: TVertexData;
    timestamp: string;
    params: any;
    messages: TChatOutput[] | TChatInput[];
    artifacts: any | TChatOutput | TChatInput;
};

export type TErrorLog = {
    errorMessage: string;
    stackTrace: string;
};

export type TOutputLog = {
    message: any | TErrorLog;
    type: string;
};
export type TLogsLog = {
    name: string;
    message: any | TErrorLog;
    type: string;
};

// data is the object received by the API
// it has results, artifacts, timedelta, duration
export type TVertexData = {
    results: { [key: string]: string };
    outputs: { [key: string]: TOutputLog };
    logs: { [key: string]: TLogsLog };
    messages: TChatOutput[] | TChatInput[];
    inactive?: bool;
    timedelta?: number;
    duration?: string;
    artifacts?: any | TChatOutput | TChatInput;
    message?: TChatOutput | TChatInput;
};

interface IVerticesSortedEvent {
    type: "vertices_sorted";
    data: {
        ids: string[];
        to_run: string[];
    };
}

interface IAddMessageEvent {
    type: "add_message";
    data: TChatMessage;
}

interface IEndVertexEvent {
    type: "end_vertex";
    data: {
        build_data: TVertexBuildData;
    };
}

interface IEndEvent {
    type: "end";
    data: {};
}

interface IErrorEvent {
    type: "error";
    data: TChatMessage;
}

export type TChatEvent = IVerticesSortedEvent | IAddMessageEvent | IEndVertexEvent | IEndEvent | IErrorEvent;
