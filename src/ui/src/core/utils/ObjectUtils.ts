/* eslint-disable @typescript-eslint/no-explicit-any */
type TExcludeUndefined<T> = Exclude<T, undefined>;
type TDeepValue<TRecord, TPath extends readonly string[]> = TPath extends [infer THead, ...infer TRest]
    ? THead extends string
        ? TRest extends readonly string[]
            ? TExcludeUndefined<
                  THead extends keyof TRecord
                      ? TDeepValue<TRecord[THead], TRest>
                      : TRecord extends Record<string, infer TValue>
                        ? TDeepValue<TValue, TRest>
                        : never
              >
            : TExcludeUndefined<THead extends keyof TRecord ? TRecord[THead] : TRecord extends Record<string, infer TValue> ? TValue : never>
        : never
    : TRecord;

type TDeepRecordMapReturn<TRecord, TPath extends readonly string[], TCreateIfMissing extends bool> = TCreateIfMissing extends true
    ? TExcludeUndefined<TDeepValue<TRecord, TPath>>
    : TDeepValue<TRecord, TPath> | undefined;

export const getDeepRecordMap = <TCreateIfMissing extends bool, TRecord extends Record<string, any>, TPath extends readonly string[]>(
    createIfMissing: TCreateIfMissing,
    record: TRecord,
    ...path: TPath
): TDeepRecordMapReturn<TRecord, TPath, TCreateIfMissing> => {
    let current: any = record;
    for (const key of path) {
        if (!(key in current)) {
            if (createIfMissing) {
                current[key] = {};
            } else {
                return undefined as TDeepRecordMapReturn<TRecord, TPath, TCreateIfMissing>;
            }
        }
        current = current[key];
    }

    return current as TDeepRecordMapReturn<TRecord, TPath, TCreateIfMissing>;
};

export const deleteDeepRecordMap = <TRecord extends Record<string, any>, TPath extends readonly string[]>(record: TRecord, ...path: TPath): void => {
    const deepMap = getDeepRecordMap<false, TRecord, TPath>(false, record, ...path);
    if (!deepMap) {
        return;
    }

    const recordStack: any[] = [record];
    for (let i = 0; i < path.length - 1; ++i) {
        const key = path[i];
        const current = recordStack[recordStack.length - 1];
        if (key in current) {
            recordStack.push(current[key]);
        } else {
            return;
        }
    }

    for (let i = recordStack.length - 1; i >= 0; --i) {
        const current = recordStack[i];
        const key = path[i];
        if (i === recordStack.length - 1) {
            delete current[key];
        } else {
            if (Object.keys(current[key]).length === 0) {
                delete current[key];
            }
        }
    }
};
