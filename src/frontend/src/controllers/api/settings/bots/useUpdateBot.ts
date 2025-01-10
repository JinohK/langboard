import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { BotModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateBotForm {
    bot_name?: string;
    bot_uname?: string;
    avatar?: File;
    delete_avatar?: bool;
}

const useUpdateBot = (bot: BotModel.TModel, options?: TMutationOptions<IUpdateBotForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.SETTINGS.BOTS.UPDATE, { bot_uid: bot.uid });
    const { createToastCreator } = useRevert<Partial<BotModel.Interface>>(url, (originalValues) => {
        BotModel.Model.fromObject({
            uid: bot.uid,
            ...originalValues,
        });
    });

    const updateBot = async (params: IUpdateBotForm) => {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            if (key === "avatar") {
                formData.append(key, value as unknown as File, (value as unknown as File).name);
            } else {
                formData.append(key, value.toString());
            }
        });

        const res = await api.put(url, formData);

        const originalValues: Partial<BotModel.Interface> = {};

        if (res.data.name) {
            originalValues.name = bot.name;
            bot.name = res.data.name;
        }

        if (res.data.bot_uname) {
            originalValues.bot_uname = bot.bot_uname;
            bot.bot_uname = res.data.bot_uname;
        }

        if (res.data.deleted_avatar) {
            originalValues.avatar = bot.avatar;
            bot.avatar = undefined;
        } else if (res.data.avatar) {
            originalValues.avatar = bot.avatar;
            bot.avatar = res.data.avatar;
        }

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, originalValues),
        };
    };

    const result = mutate(["update-bot"], updateBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateBot;
