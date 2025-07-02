/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { InternalBotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useChangeInternalBotDefault = (bot: InternalBotModel.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const changeInternalBotDefault = async () => {
        if (bot.is_default) {
            return Promise.resolve();
        }

        const url = Utils.String.format(API_ROUTES.SETTINGS.INTERNAL_BOTS.CHANGE_DEFAULT, { bot_uid: bot.uid });
        const res = await api.put(url, undefined, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["change-internal-bot-default"], changeInternalBotDefault, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeInternalBotDefault;
