import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { BotModel } from "@/core/models";

export interface ICreateBotForm {
    bot_name: string;
    bot_uname: string;
    avatar?: File;
}

const useCreateBot = (options?: TMutationOptions<ICreateBotForm>) => {
    const { mutate } = useQueryMutation();

    const createBot = async (params: ICreateBotForm) => {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            if (key === "avatar") {
                if (value) {
                    formData.append(key, value as unknown as File, (value as unknown as File).name);
                }
            } else {
                formData.append(key, value);
            }
        });

        const res = await api.post(API_ROUTES.SETTINGS.BOTS.CREATE, formData);

        BotModel.Model.fromObject(res.data.bot, true);

        return res.data;
    };

    const result = mutate(["create-bot"], createBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateBot;
