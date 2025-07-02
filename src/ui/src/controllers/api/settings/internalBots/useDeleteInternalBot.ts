/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { InternalBotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useDeleteInternalBot = (bot: InternalBotModel.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteInternalBot = async () => {
        const url = Utils.String.format(API_ROUTES.SETTINGS.INTERNAL_BOTS.DELETE, { bot_uid: bot.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["delete-internal-bot"], deleteInternalBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteInternalBot;
