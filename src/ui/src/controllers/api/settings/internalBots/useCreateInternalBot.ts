/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { InternalBotModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface ICreateInternalBotForm {
    bot_type: InternalBotModel.EInternalBotType;
    display_name: string;
    platform: InternalBotModel.EInternalBotPlatform;
    platform_running_type: InternalBotModel.EInternalBotPlatformRunningType;
    url: string;
    api_key?: string;
    value: string;
    avatar?: File;
}

const useCreateInternalBot = (options?: TMutationOptions<ICreateInternalBotForm>) => {
    const { mutate } = useQueryMutation();

    const createInternalBot = async (params: ICreateInternalBotForm) => {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (Utils.Type.isNullOrUndefined(value)) {
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

        const res = await api.post(API_ROUTES.SETTINGS.INTERNAL_BOTS.CREATE, formData, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["create-internal-bot"], createInternalBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateInternalBot;
