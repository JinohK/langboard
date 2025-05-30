import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";
import { EBotTriggerCondition } from "@/core/models/bot.type";
import { format } from "@/core/utils/StringUtils";

export interface IToggleBotTriggerConditionForm {
    condition: EBotTriggerCondition;
}

const useToggleBotTriggerCondition = (bot: BotModel.TModel, options?: TMutationOptions<IToggleBotTriggerConditionForm>) => {
    const { mutate } = useQueryMutation();

    const toggleBotTriggerCondition = async (params: IToggleBotTriggerConditionForm) => {
        const url = format(API_ROUTES.SETTINGS.BOTS.TOGGLE_TRIGGER_CONDITION, { bot_uid: bot.uid });
        const res = await api.put(url, {
            condition: params.condition,
        });

        return res.data;
    };

    const result = mutate(["toggle-bot-trigger-condition"], toggleBotTriggerCondition, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleBotTriggerCondition;
