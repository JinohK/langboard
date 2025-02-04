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

            if (key === "avatar") {
                formData.append(key, value as unknown as File, (value as unknown as File).name);
            } else {
                formData.append(key, value);
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
