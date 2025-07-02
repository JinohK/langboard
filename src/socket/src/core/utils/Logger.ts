/* eslint-disable @typescript-eslint/no-explicit-any */
import { Utils } from "@langboard/core/utils";
import { createRequire } from "module";
import { Terminal } from "terminal-kit";
const require = createRequire(import.meta.url);
const rawTerm: Terminal = require("terminal-kit").terminal;

function getDatePrefix() {
    const now = new Date();
    return `[${now.toISOString().replace("T", " ").slice(0, 19)}] `;
}

function wrapWithDate(term: Terminal) {
    return new Proxy(term, {
        get(target, prop) {
            const value = (target as any)[prop];

            if (Utils.Type.isFunction(value)) {
                return (...args: any[]) => {
                    target.dim(getDatePrefix());
                    return value.apply(target, args);
                };
            }

            return wrapWithDate(value);
        },
        apply(target, thisArg, args) {
            target.dim(getDatePrefix());
            return target.apply(thisArg, args);
        },
    });
}

const Logger = wrapWithDate(rawTerm);

export default Logger;
