/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Project, ProjectCard, ProjectCheckitem } from "@/core/models";
import { useEffect, useRef, useState } from "react";

const useGetTrackingList = (limit: number = 30, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();
    const [isLastPage, setIsLastPage] = useState(true);
    const [checkitemUIDs, setCheckitemUIDs] = useState<string[]>([]);
    const isFetchingRef = useRef(false);
    const lastCurrentDateRef = useRef(new Date());
    const pageRef = useRef(0);

    const getTrackingList = async () => {
        if ((isLastPage && pageRef.current) || isFetchingRef.current) {
            return {};
        }

        isFetchingRef.current = true;

        ++pageRef.current;

        const res = await api.get(Routing.API.DASHBOARD.TRACKING, {
            params: {
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit,
            },
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        Project.Model.fromArray(res.data.projects, true);
        ProjectCard.Model.fromArray(res.data.cards, true);
        ProjectCheckitem.Model.fromArray(res.data.checkitems, true);
        setCheckitemUIDs((prev) => [
            ...prev.filter((uid) => !(res.data.checkitems as ProjectCheckitem.Interface[]).some((item) => item.uid === uid)),
            ...(res.data.checkitems as ProjectCheckitem.Interface[]).map((item) => item.uid),
        ]);

        setIsLastPage(res.data.checkitems.length < limit);

        isFetchingRef.current = false;

        return {};
    };

    useEffect(() => {
        if (pageRef.current) {
            return;
        }

        lastCurrentDateRef.current = new Date();
        setTimeout(() => {
            getTrackingList();
        }, 0);

        return () => {
            pageRef.current = 0;
        };
    }, []);

    const result = mutate(["get-dashboard-tracking-list"], getTrackingList, {
        ...options,
        retry: 0,
    });
    return { ...result, isLastPage, checkitemUIDs, isFetchingRef };
};

export default useGetTrackingList;
