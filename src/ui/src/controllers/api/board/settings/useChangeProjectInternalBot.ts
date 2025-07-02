/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { Utils } from "@langboard/core/utils";

interface IChangeProjectInternalBotForm {
    internal_bot_uid: string;
}

interface IChangeProjectInternalBotResponse {}

const useChangeProjectInternalBot = (
    projectUID: string,
    options?: TMutationOptions<IChangeProjectInternalBotForm, IChangeProjectInternalBotResponse>
) => {
    const { mutate } = useQueryMutation();

    const changeProjectInternalBot = async (params: IChangeProjectInternalBotForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.SETTINGS.CHANGE_INTERNAL_BOT, { uid: projectUID });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["change-project-internal-bot"], changeProjectInternalBot, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useChangeProjectInternalBot;
