/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { Classes, OnError } from "@/components/Cron/types";
import { TFunction } from "i18next";

/**
 * Creates an array of integers from start to end, inclusive
 */
export function range(start: number, end: number) {
    const array: number[] = [];

    for (let i = start; i <= end; i++) {
        array.push(i);
    }

    return array;
}

/**
 * Sorts an array of numbers
 */
export function sort(array: number[]) {
    array.sort(function (a, b) {
        return a - b;
    });

    return array;
}

/**
 * Removes duplicate entries from an array
 */
export function dedup(array: number[]) {
    const result: number[] = [];

    array.forEach(function (i) {
        if (result.indexOf(i) < 0) {
            result.push(i);
        }
    });

    return result;
}

/**
 * Simple classNames util function to prevent adding external library 'classnames'
 */
export function classNames(classes: Classes) {
    return Object.entries(classes)
        .filter(([key, value]) => key && value)
        .map(([key]) => key)
        .join(" ");
}

/**
 * Handle onError prop to set the error
 */
export function setError(onError: OnError, t: TFunction<"translation", undefined>) {
    if (onError) {
        onError({
            type: "invalid_cron",
            description: t("cron.Invalid cron expression"),
        });
    }
}

/**
 * React useEffect hook to return the previous value
 */
export function usePrevious(value: any) {
    const ref = useRef(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * Convert a string to number but fail if not valid for cron
 */
export function convertStringToNumber(str: string) {
    const parseIntValue = parseInt(str, 10);
    const numberValue = Number(str);

    return parseIntValue === numberValue ? numberValue : NaN;
}
