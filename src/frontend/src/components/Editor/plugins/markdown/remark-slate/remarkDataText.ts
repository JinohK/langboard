import { MdastNodeType } from "@/components/Editor/plugins/markdown/remark-slate/types";

export type TDataType = "audio" | "date" | "file" | "mention" | "video";

const DATA_TEXT_WRAPPER_MAP: Record<TDataType, { start: string; end: string }> = {
    audio: { start: "au", end: "ua" },
    date: { start: "dt", end: "td" },
    file: { start: "fl", end: "lf" },
    mention: { start: "mn", end: "nm" },
    video: { start: "vd", end: "dv" },
};

export const createDataText = (type: TDataType, params: string[], value?: string): string => {
    const wrapper = DATA_TEXT_WRAPPER_MAP[type];

    return `!([${wrapper.start}:${params.map((v) => v.replace(/:/g, "{colon}")).join(":")}])${value ?? ""}([/${wrapper.end}])`;
};

export const getDataTextType = (text: string): MdastNodeType | undefined => {
    if (!text) {
        return undefined;
    }

    const keys = Object.keys(DATA_TEXT_WRAPPER_MAP);
    for (let i = 0; i < keys.length; ++i) {
        const wrapper = DATA_TEXT_WRAPPER_MAP[keys[i] as TDataType];
        if (text.includes(`!([${wrapper.start}`) && text.includes(`/${wrapper.end}])`)) {
            return keys[i] as MdastNodeType;
        }
    }

    return undefined;
};

export const isDataTextType = (text: string | undefined): text is string => {
    if (!text) {
        return false;
    }

    const keys = Object.keys(DATA_TEXT_WRAPPER_MAP);
    for (let i = 0; i < keys.length; ++i) {
        const wrapper = DATA_TEXT_WRAPPER_MAP[keys[i] as TDataType];
        if (text.includes(`!([${wrapper.start}`) && text.includes(`/${wrapper.end}])`)) {
            return true;
        }
    }

    return false;
};

export interface ISplittedDataText {
    leftChunk: string;
    dataChunk: {
        params: string[];
        value: string;
    };
    rightChunk: string;
}

export const splitDataText = (type: TDataType, text: string): ISplittedDataText => {
    const wrapper = DATA_TEXT_WRAPPER_MAP[type];

    const chunks = text.split(`!([${wrapper.start}:`);
    const leftChunk = chunks.shift() ?? "";
    const dataChunks = (chunks.shift() ?? `([/${wrapper.end}])`).split(`([/${wrapper.end}])`);
    const dataTextChunks = (dataChunks.shift() ?? "])").split("])");
    const params = (dataTextChunks.shift() ?? "").split(":").map((v) => v.replace(/{colon}/g, ":"));
    const value = dataTextChunks.join("])");
    const rightChunk = dataChunks.join(`([/${wrapper.end}])`);

    return {
        leftChunk,
        dataChunk: {
            params,
            value,
        },
        rightChunk,
    };
};
