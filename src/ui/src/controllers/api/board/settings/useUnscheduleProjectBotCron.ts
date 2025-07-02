/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotSchedule } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUnscheduleProjectBotCronForm {
    project_uid: string;
    bot_uid: string;
    schedule_uid: string;
}

export interface IUnscheduleProjectBotCronResponse {}

const useUnscheduleProjectBotCron = (options?: TMutationOptions<IUnscheduleProjectBotCronForm>) => {
    const { mutate } = useQueryMutation();

    const unscheduleProjectBotCron = async (params: IUnscheduleProjectBotCronForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.SETTINGS.BOT_SCHEDULE.UNSCHEDULE, {
            uid: params.project_uid,
            bot_uid: params.bot_uid,
            schedule_uid: params.schedule_uid,
        });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        BotSchedule.Model.deleteModel(params.schedule_uid);

        return res.data;
    };

    const result = mutate(["unschedule-project-bot-cron"], unscheduleProjectBotCron, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUnscheduleProjectBotCron;
