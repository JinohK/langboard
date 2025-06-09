/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
const noiseValue = /^-?\d+n+$/; // Noise - strings that match the custom format before being converted to it
const originalStringify = JSON.stringify;
const originalParse = JSON.parse;

/*
  Function to serialize value to a JSON string.
  Converts BigInt values to a custom format (strings with digits and "n" at the end) and then converts them to proper big integers in a JSON string.
*/
const Stringify: typeof JSON.stringify = (value, replacer, space) => {
    if ("rawJSON" in JSON) {
        return originalStringify(
            value,
            (key, value) => {
                if (typeof value === "bigint") return (JSON as any).rawJSON(value.toString());

                if (typeof replacer === "function") return replacer(key, value);

                if (Array.isArray(replacer) && replacer.includes(key)) return value;

                return value;
            },
            space
        );
    }

    if (!value) return originalStringify(value, replacer as any, space);

    const bigInts = /([\[:])?"(-?\d+)n"($|([\\n]|\s)*(\s|[\\n])*[,\}\]])/g;
    const noise = /([\[:])?("-?\d+n+)n("$|"([\\n]|\s)*(\s|[\\n])*[,\}\]])/g;
    const convertedToCustomJSON = originalStringify(
        value,
        (key, value) => {
            const isNoise = typeof value === "string" && Boolean(value.match(noiseValue));

            if (isNoise) return value.toString() + "n";

            if (typeof value === "bigint") return value.toString() + "n";

            if (typeof replacer === "function") return replacer(key, value);

            if (Array.isArray(replacer) && replacer.includes(key)) return value;

            return value;
        },
        space
    );
    const processedJSON = convertedToCustomJSON.replace(bigInts, "$1$2$3");
    const denoisedJSON = processedJSON.replace(noise, "$1$2$3");

    return denoisedJSON;
};

const Parse: typeof JSON.parse = (text, reviver) => {
    if (!text) return originalParse(text, reviver);

    const MAX_INT = Number.MAX_SAFE_INTEGER.toString();
    const MAX_DIGITS = MAX_INT.length;
    const stringsOrLargeNumbers = /"(?:\\.|[^"])*"|-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/g;
    const noiseValueWithQuotes = /^"-?\d+n+"$/; // Noise - strings that match the custom format before being converted to it
    const customFormat = /^-?\d+n$/;

    // Find and mark big numbers with "n"
    const serializedData = text.replace(stringsOrLargeNumbers, (text, digits, fractional, exponential) => {
        const isString = text[0] === '"';
        const isNoise = isString && Boolean(text.match(noiseValueWithQuotes));

        if (isNoise) return text.substring(0, text.length - 1) + 'n"';

        const isFractionalOrExponential = fractional || exponential;
        const isLessThanMaxSafeInt = digits && (digits.length < MAX_DIGITS || (digits.length === MAX_DIGITS && digits <= MAX_INT));

        if (isString || isFractionalOrExponential || isLessThanMaxSafeInt) return text;

        return '"' + text + 'n"';
    });

    return originalParse(serializedData, (key: any, value: any) => {
        const isCustomFormatBigInt = typeof value === "string" && Boolean(value.match(customFormat));

        if (isCustomFormatBigInt) return BigInt(value.substring(0, value.length - 1));

        const isNoiseValue = typeof value === "string" && Boolean(value.match(noiseValue));

        if (isNoiseValue) return value.substring(0, value.length - 1); // Remove one "n" off the end of the noisy string

        if (typeof reviver !== "function") return value;

        return reviver(key, value);
    });
};

export default {
    Stringify,
    Parse,
};
