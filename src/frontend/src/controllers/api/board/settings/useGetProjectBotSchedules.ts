import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotSchedule, ProjectCard, ProjectColumn } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGetProjectBotSchedulesForm {
    bot_uid: string;
}

const useGetProjectBotSchedules = (projectUID: string, options?: TMutationOptions<IGetProjectBotSchedulesForm>) => {
    const { mutate } = useQueryMutation();

    const getProjectBotSchedules = async (params: IGetProjectBotSchedulesForm) => {
        const url = format(API_ROUTES.BOARD.SETTINGS.BOT_SCHEDULE.GET_ALL, {
            uid: projectUID,
            bot_uid: params.bot_uid,
        });
        const res = await api.get(url, {
            params,
        });

        for (let i = 0; i < res.data.schedules.length; ++i) {
            const schedule = res.data.schedules[i];
            switch (schedule.target_table as BotSchedule.TTargetTable) {
                case "project_column":
                    ProjectColumn.Model.fromObject(schedule.target);
                    break;
                case "card":
                    ProjectCard.Model.fromObject(schedule.target);
                    break;
            }

            delete schedule.target;
        }

        BotSchedule.Model.fromObjectArray(res.data.schedules, true);

        return {};
    };

    const result = mutate(["get-project-bot-schedules"], getProjectBotSchedules, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetProjectBotSchedules;
