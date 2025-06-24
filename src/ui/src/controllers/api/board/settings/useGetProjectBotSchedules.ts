/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotSchedule, ProjectCard, ProjectColumn } from "@/core/models";
import { format } from "@/core/utils/StringUtils";
import { useEffect, useRef, useState } from "react";

const useGetProjectBotSchedules = (projectUID: string, botUID: string, limit: number = 20, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();
    const [isLastPage, setIsLastPage] = useState(true);
    const isFetchingRef = useRef(false);
    const lastCurrentDateRef = useRef(new Date());
    const pageRef = useRef(0);

    const getProjectBotSchedules = async () => {
        if ((isLastPage && pageRef.current) || isFetchingRef.current) {
            return {};
        }

        isFetchingRef.current = true;

        ++pageRef.current;

        const url = format(API_ROUTES.BOARD.SETTINGS.BOT_SCHEDULE.GET_ALL, {
            uid: projectUID,
            bot_uid: botUID,
        });
        const res = await api.get(url, {
            params: {
                bot_uid: botUID,
                refer_time: lastCurrentDateRef.current,
                page: pageRef.current,
                limit,
            },
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        for (let i = 0; i < res.data.schedules.length; ++i) {
            const schedule = res.data.schedules[i];
            switch (schedule.target_table as BotSchedule.TTargetTable) {
                case "project_column":
                    ProjectColumn.Model.fromOne(schedule.target);
                    break;
                case "card":
                    ProjectCard.Model.fromOne(schedule.target);
                    break;
            }

            delete schedule.target;
        }

        BotSchedule.Model.fromArray(res.data.schedules, true);

        setIsLastPage(res.data.schedules.length < limit);

        isFetchingRef.current = false;

        return {};
    };

    useEffect(() => {
        if (pageRef.current) {
            return;
        }

        lastCurrentDateRef.current = new Date();
        setTimeout(() => {
            getProjectBotSchedules();
        }, 0);

        return () => {
            pageRef.current = 0;
        };
    }, []);

    const result = mutate(["get-project-bot-schedules"], getProjectBotSchedules, {
        ...options,
        retry: 0,
    });

    return { ...result, isLastPage, isFetchingRef };
};

export default useGetProjectBotSchedules;
