/* eslint-disable @typescript-eslint/no-explicit-any */
import { TBotScopeRelatedParams } from "@/controllers/api/shared/botScopes/types";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { EBotTriggerCondition } from "@/core/models/botScopes/EBotTriggerCondition";
import { Utils } from "@langboard/core/utils";

export type TUseCreateBotScopeParams = TBotScopeRelatedParams & {
    bot_uid: string;
};

export interface ICreateBotScopeForm {
    conditions: EBotTriggerCondition[];
}

const useCreateBotScope = (params: TUseCreateBotScopeParams, options?: TMutationOptions<ICreateBotScopeForm>) => {
    const { mutate } = useQueryMutation();

    const createBotScope = async (form: ICreateBotScopeForm) => {
        const url = Utils.String.format(API_ROUTES.BOARD.BOT.SCOPE.CREATE, {
            uid: params.project_uid,
            bot_uid: params.bot_uid,
        });
        const res = await api.post(
            url,
            {
                target_table: params.target_table,
                target_uid: params.target_uid,
                conditions: form.conditions,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        return res.data;
    };

    const result = mutate(["create-bot-scope"], createBotScope, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateBotScope;
