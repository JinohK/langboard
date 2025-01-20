import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteBot = (bot: BotModel.TModel, options?: TMutationOptions<unknown>) => {
    const { mutate } = useQueryMutation();

    const deleteBot = async () => {
        const url = format(API_ROUTES.SETTINGS.BOTS.DELETE, { bot_uid: bot.uid });
        const res = await api.delete(url);

        BotModel.Model.deleteModel(bot.uid);

        return res.data;
    };

    const result = mutate(["delete-bot"], deleteBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteBot;
