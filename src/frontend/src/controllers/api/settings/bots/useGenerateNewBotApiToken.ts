import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IGenerateNewBotApiTokenResponse {
    revealed_app_api_token: string;
}

const useGenerateNewBotApiToken = (bot: BotModel.TModel, options?: TMutationOptions<unknown, IGenerateNewBotApiTokenResponse>) => {
    const { mutate } = useQueryMutation();

    const generateNewBotApiToken = async () => {
        const url = format(API_ROUTES.SETTINGS.BOTS.GENERATE_NEW_API_TOKEN, { bot_uid: bot.uid });
        const res = await api.put(url);

        bot.app_api_token = res.data.secret_app_api_token;

        return {
            revealed_app_api_token: res.data.revealed_app_api_token,
        };
    };

    const result = mutate(["generate-new-bot-api-token"], generateNewBotApiToken, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGenerateNewBotApiToken;
