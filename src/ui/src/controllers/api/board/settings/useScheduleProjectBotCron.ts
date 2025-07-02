/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotSchedule } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IScheduleProjectBotCronForm {
    project_uid: string;
    bot_uid: string;
    interval: string;
    scope: {
        type: BotSchedule.TTargetTable;
        uid: string;
    };
    running_type?: BotSchedule.ERunningType;
    start_at?: Date;
    end_at?: Date;
}

const useScheduleProjectBotCron = (options?: TMutationOptions<IScheduleProjectBotCronForm>) => {
    const { mutate } = useQueryMutation();

    const scheduleProjectBotCron = async (params: IScheduleProjectBotCronForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.SETTINGS.BOT_SCHEDULE.SCHEDULE, {
            uid: params.project_uid,
            bot_uid: params.bot_uid,
        });
        const res = await api.post(
            url,
            {
                interval_str: params.interval,
                target_table: params.scope.type,
                target_uid: params.scope.uid,
                running_type: params.running_type,
                start_at: params.start_at,
                end_at: params.end_at,
                timezone: new Date().getTimezoneOffset() / -60,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["schedule-project-bot-cron"], scheduleProjectBotCron, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useScheduleProjectBotCron;
