/* eslint-disable @typescript-eslint/no-explicit-any */
import { Utils } from "@langboard/core/utils";

(Utils.String as any).BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

Utils.String.isValidURL = (str: unknown): boolean => {
    if (typeof str !== "string") {
        return false;
    }

    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};
