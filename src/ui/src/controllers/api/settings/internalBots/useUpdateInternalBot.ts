/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { InternalBotModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface IUpdateInternalBotForm {
    display_name?: string;
    platform?: InternalBotModel.EInternalBotPlatform;
    platform_running_type?: InternalBotModel.EInternalBotPlatformRunningType;
    url?: string;
    api_key?: string;
    value?: string;
    avatar?: File;
    delete_avatar?: bool;
}

const useUpdateInternalBot = (bot: InternalBotModel.TModel, options?: TMutationOptions<IUpdateInternalBotForm>) => {
    const { mutate } = useQueryMutation();

    const updateInternalBot = async (params: IUpdateInternalBotForm) => {
        const url = format(API_ROUTES.SETTINGS.INTERNAL_BOTS.UPDATE, { bot_uid: bot.uid });
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (TypeUtils.isNullOrUndefined(value)) {
                return;
            }

            const isAvatar = (targetKey: string, targetValue: unknown): targetValue is File => targetKey === "avatar";

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
