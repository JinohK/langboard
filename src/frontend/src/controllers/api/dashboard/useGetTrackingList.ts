import { API_ROUTES } from "@/controllers/constants";
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

        const res = await api.get(API_ROUTES.DASHBOARD.TRACKING, {
            params: {
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit,
            },
        });

        Project.Model.fromObjectArray(res.data.projects, true);
        ProjectCard.Model.fromObjectArray(res.data.cards, true);
        ProjectCheckitem.Model.fromObjectArray(res.data.checkitems, true);
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
