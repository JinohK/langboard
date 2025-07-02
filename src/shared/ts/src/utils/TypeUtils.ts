const getType = (value: unknown = undefined): string => {
    const type: string = typeof value;
    switch (true) {
        case value === null:
            return "null";
        case type === "object" && Array.isArray(value):
            return "array";
        default:
            return type;
    }
};

const isType =
    <T>(type: string) =>
    (value: unknown): value is T =>
        getType(value) === type;

const isArray: <T>(value: unknown) => value is T[] = isType("array");
const isNumber: (value: unknown) => value is number = isType("number");
const isBigInt: (value: unknown) => value is bigint = isType("bigint");
const isObject: <T = object>(value: unknown) => value is T = isType("object");
const isString: (value: unknown) => value is string = isType("string");
const isBool: (value: unknown) => value is bool = isType(typeof true);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isFunction: <TFunc extends (...args: any) => any>(value: unknown | TFunc) => value is (...params: Parameters<TFunc>) => ReturnType<TFunc> =
    isType("function");
const isNull: (value: unknown) => value is null = isType("null");
const isUndefined: (value: unknown) => value is undefined = isType("undefined");
const isNullOrUndefined = (value: unknown): value is null | undefined => isNull(value) || isUndefined(value);
const isError = (value: unknown): value is Error => isObject(value) && isString((value as Error).message) && isString((value as Error).name);

const getProperty = <T>(obj: unknown, key: string): T | undefined => Object.assign(obj ?? {})?.[key];
const hasProperty = <T>(obj: unknown, key: string): obj is T => {
    const assigned = Object.assign(obj ?? {})?.[key];
    if (isUndefined(assigned) || isNull(assigned)) return false;
    return true;
};

export const TypeUtils = {
    isArray,
    isNumber,
    isBigInt,
    isObject,
    isString,
    isBool,
    isFunction,
    isNull,
    isUndefined,
    isNullOrUndefined,
    isError,
    getProperty,
    hasProperty,
};

export type TTypeUtils = typeof TypeUtils;
