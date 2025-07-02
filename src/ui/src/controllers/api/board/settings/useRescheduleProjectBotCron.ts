/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotSchedule } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IRescheduleProjectBotCronForm {
    project_uid: string;
    bot_uid: string;
    schedule_uid: string;
    interval?: string;
    scope?: {
        type?: BotSchedule.TTargetTable;
        uid?: string;
    };
    running_type?: BotSchedule.ERunningType;
    start_at?: Date;
    end_at?: Date;
}

const useRescheduleProjectBotCron = (options?: TMutationOptions<IRescheduleProjectBotCronForm>) => {
    const { mutate } = useQueryMutation();

    const rescheduleProjectBotCron = async (params: IRescheduleProjectBotCronForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.SETTINGS.BOT_SCHEDULE.RESCHEDULE, {
            uid: params.project_uid,
            bot_uid: params.bot_uid,
            schedule_uid: params.schedule_uid,
        });
        const res = await api.put(
            url,
            {
                interval_str: params.interval,
                target_table: params.scope?.type,
                target_uid: params.scope?.uid,
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

    const result = mutate(["reschedule-project-bot-cron"], rescheduleProjectBotCron, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useRescheduleProjectBotCron;
