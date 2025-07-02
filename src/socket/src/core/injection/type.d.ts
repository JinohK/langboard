import type { IUtils } from "@langboard/core/utils";

export declare module "@langboard/core/utils" {
    const Utils: IUtils & {
        readonly String: {
            readonly BASE62_ALPHABET: Readonly<string>;
            isValidURL: (str: unknown) => bool;
        };
    };
}
