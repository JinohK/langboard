import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { BotModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteBot = (bot: BotModel.TModel, options?: TMutationOptions<unknown, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.SETTINGS.BOTS.DELETE, { bot_uid: bot.uid });
    const { createToastCreator } = useRevert(url, () => {
        BotModel.Model.addModel(bot, true);
    });

    const deleteBot = async () => {
        const res = await api.delete(url);

        BotModel.Model.deleteModel(bot.uid);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, undefined),
        };
    };

    const result = mutate(["delete-bot"], deleteBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteBot;
