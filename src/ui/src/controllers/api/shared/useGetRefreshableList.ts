/* eslint-disable @typescript-eslint/no-explicit-any */
import { TGetListForm } from "@/controllers/api/shared/types";
import { getListRequestData } from "@/controllers/api/shared/utils";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BaseModel } from "@/core/models/Base";
import { TCreatedAtModel, TCreatedAtModelName } from "@/core/models/ModelRegistry";
import { useCallback, useRef, useState } from "react";

export interface IUseGetRefreshableListProps<TModelName extends TCreatedAtModelName> {
    form: TGetListForm<TModelName>;
    limit: number;
    isLastPage: bool;
    setIsLastPage: React.Dispatch<React.SetStateAction<bool>>;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    lastCurrentDateRef: React.RefObject<Date>;
    prepareData?: (
        list: Omit<TCreatedAtModel<IUseGetRefreshableListProps<TModelName>["form"]["listType"]>, keyof Omit<BaseModel<any>, "uid">>[],
        data: any
    ) => void;
}

export interface IGetRefreshableListParams {
    page: number;
}

const useGetRefreshableList = <TModelName extends TCreatedAtModelName>(
    { form, limit, setPage, lastCurrentDateRef, isLastPage, setIsLastPage, prepareData }: IUseGetRefreshableListProps<TModelName>,
    options?: TMutationOptions
) => {
    const { mutate } = useQueryMutation();
    const [countNewRecords, setCountNewRecords] = useState(0);
    const isFetchingRef = useRef(false);
    const limitRef = useRef(limit);

    const [model, url] = getListRequestData(form);

    const getRefreshableList = useCallback(
        async (params: IGetRefreshableListParams) => {
            if ((isLastPage && params.page) || isFetchingRef.current) {
                return {};
            }

            isFetchingRef.current = true;

            ++params.page;

            const res = await api.get(url, {
                params: {
                    ...params,
                    refer_time: lastCurrentDateRef.current,
                    limit: limitRef.current,
                },
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            });

            if (res.data.list) {
                prepareData?.(res.data.list, res.data);
            }

            model.fromArray(res.data.list, true);

            setIsLastPage(res.data.list.length < limitRef.current);
            if (res.data.count_new_records) {
                setCountNewRecords(res.data.count_new_records);
            }

            isFetchingRef.current = false;

            return {};
        },
        [isLastPage, countNewRecords, setPage, setIsLastPage, setCountNewRecords]
    );

    const refresh = useCallback(async () => {
        if (isFetchingRef.current || !countNewRecords) {
            return;
        }

        const curLimit = limitRef.current;
        limitRef.current = countNewRecords;
        lastCurrentDateRef.current = new Date();

        await getRefreshableList({
            page: 0,
        });

        limitRef.current = curLimit;
        setPage((prev) => prev + Math.ceil(countNewRecords / limitRef.current));
        setCountNewRecords(0);
    }, [setPage, getRefreshableList, countNewRecords, setCountNewRecords]);

    const checkOutdated = useCallback(
        async (referTime: Date) => {
            if (isFetchingRef.current) {
                return;
            }

            const res = await api.get(url, {
                params: {
                    only_count: true,
                    refer_time: referTime,
                    page: 1,
                    limit: 1,
                },
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            });

            if (res.data.count_new_records) {
                setCountNewRecords(res.data.count_new_records);
            }
        },
        [countNewRecords, setCountNewRecords]
    );

    const result = mutate([`get-refreshable-list-${url.replace(/\//g, "-")}`], getRefreshableList, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage, countNewRecords, refresh, checkOutdated };
};

export default useGetRefreshableList;
