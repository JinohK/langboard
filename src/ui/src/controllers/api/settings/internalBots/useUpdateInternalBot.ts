/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { InternalBotModel } from "@/core/models";
import { EBotPlatform, EBotPlatformRunningType } from "@/core/models/bot.related.type";
import { Utils } from "@langboard/core/utils";

export interface IUpdateInternalBotForm {
    display_name?: string;
    platform?: EBotPlatform;
    platform_running_type?: EBotPlatformRunningType;
    url?: string;
    api_key?: string;
    value?: string;
    avatar?: File;
    delete_avatar?: bool;
}

const useUpdateInternalBot = (bot: InternalBotModel.TModel, options?: TMutationOptions<IUpdateInternalBotForm>) => {
    const { mutate } = useQueryMutation();

    const updateInternalBot = async (params: IUpdateInternalBotForm) => {
        const url = Utils.String.format(API_ROUTES.SETTINGS.INTERNAL_BOTS.UPDATE, { bot_uid: bot.uid });
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (Utils.Type.isNullOrUndefined(value)) {
                return;
            }

            const isAvatar = (targetKey: string, _: unknown): _ is File => targetKey === "avatar";

            if (isAvatar(key, value)) {
                if (!value) {
                    return;
                }

                formData.append(key, value, value.name);
            } else {
                formData.append(key, value.toString());
            }
        });

        const res = await api.put(url, formData, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["update-internal-bot"], updateInternalBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateInternalBot;
