import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";

export interface ICreateBotForm {
    bot_name: string;
    bot_uname: string;
    api_url: string;
    api_auth_type: BotModel.EAPIAuthType;
    api_key: string;
    ip_whitelist: string[];
    prompt: string;
    avatar?: File;
}

export interface ICreateBotResponse {
    revealed_app_api_token: string;
}

const useCreateBot = (options?: TMutationOptions<ICreateBotForm, ICreateBotResponse>) => {
    const { mutate } = useQueryMutation();

    const createBot = async (form: ICreateBotForm) => {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            const isAvatar = (targetKey: string, targetValue: unknown): targetValue is FileList => targetKey === "avatar";

            if (isAvatar(key, value)) {
                if (!value.length) {
                    return;
                }

                formData.append(key, value[0], value[0].name);
            } else {
                formData.append(key, value.toString());
            }
        });

        const res = await api.post(API_ROUTES.SETTINGS.BOTS.CREATE, formData);

        BotModel.Model.fromObject(res.data.bot, true);

        return {
            revealed_app_api_token: res.data.revealed_app_api_token,
        };
    };

    const result = mutate(["create-bot"], createBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateBot;
