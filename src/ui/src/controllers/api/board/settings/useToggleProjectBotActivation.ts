/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

export interface IToggleProjectBotActivationForm {
    project_uid: string;
    bot_uid: string;
}

const useToggleProjectBotActivation = (options?: TMutationOptions<IToggleProjectBotActivationForm>) => {
    const { mutate } = useQueryMutation();

    const toggleProjectBotActivation = async (params: IToggleProjectBotActivationForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.SETTINGS.TOGGLE_BOT_ACTIVATION, {
            uid: params.project_uid,
            bot_uid: params.bot_uid,
        });
        const res = await api.put(url, undefined, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["toggle-project-bot-activation"], toggleProjectBotActivation, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useToggleProjectBotActivation;
