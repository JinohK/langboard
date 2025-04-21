/* eslint-disable @typescript-eslint/no-explicit-any */
import TypeUtils from "@/core/utils/TypeUtils";
import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface ISearchFilterMap {
    [key: string]: string[] | undefined;
}

export interface IUseSearchFiltersProps<TFilterMap extends ISearchFilterMap> {
    filterKeys: (keyof TFilterMap)[];
    searchKey?: string | "filters";
}

const updatedStore = create(
    immer<{ updated: number; forceUpdate: () => void }>((set) => ({
        updated: 0,
        forceUpdate: () => {
            set((state) => {
                state.updated += 1;
            });
        },
    }))
);

const useSearchFilters = <TFilterMap extends ISearchFilterMap>(
    { filterKeys, searchKey = "filters" }: IUseSearchFiltersProps<TFilterMap>,
    deps?: unknown[]
) => {
    const [updated, setUpdated] = useState(updatedStore.getState().updated);
    const filters = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        const rawFilters = searchParams.get(searchKey);
        const newFilters = fromString(rawFilters);
        return newFilters;
    }, [location, location.search, updated, ...(deps || [])]);

    useEffect(() => {
        const unsub = updatedStore.subscribe(() => {
            setTimeout(() => {
                setUpdated(updatedStore.getState().updated);
            }, 0);
        });

        return unsub;
    }, [updated]);

    const forceUpdate = () => {
        updatedStore.getState().forceUpdate();
        setUpdated(updatedStore.getState().updated);
    };

    function toString(): string {
        return Object.entries(filters)
            .map(([key, value]) => {
                if (!value!.length) {
                    return "";
                }
                return `${key as string}:${encodeURIComponent(encodeURIComponent(value!.join(",")))}`;
            })
            .join(",");
    }

    function fromString(rawFilters: string | null): TFilterMap {
        const filterMap = {} as TFilterMap;

        if (rawFilters) {
            rawFilters.split(",").map((rawFilter) => {
                const [key, value] = rawFilter.split(":");
                if (TypeUtils.isNull(value) || TypeUtils.isUndefined(value) || !value.length) {
                    return;
                }

                if (!filterKeys.includes(key)) {
                    return;
                }

                filterMap[key as keyof TFilterMap] = decodeURIComponent(decodeURIComponent(value)).split(",") as any;
            });
        }

        return filterMap;
    }

    function unique() {
        for (let i = 0; i < filterKeys.length; ++i) {
            const filterKey = filterKeys[i];
            const filterValue = filters[filterKey];
            if (!filterValue?.length) {
                continue;
            }

            filters[filterKey] = filterValue.filter((value, index) => filterValue.indexOf(value) === index) as any;
        }
    }

    return {
        filters,
        toString,
        fromString,
        unique,
        updated,
        forceUpdate,
    };
};

export default useSearchFilters;
