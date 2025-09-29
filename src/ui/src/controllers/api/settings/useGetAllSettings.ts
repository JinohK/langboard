/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel, BotModel, GlobalRelationshipType, InternalBotModel } from "@/core/models";

const useGetAllSettings = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getAllSettings = async () => {
        const res = await api.get(Routing.API.SETTINGS.GET_ALL, {
            env: {
                noToast: options?.interceptToast,
            } as any,
        });

        AppSettingModel.Model.fromArray(res.data.settings);
        BotModel.Model.fromArray(res.data.bots);
        GlobalRelationshipType.Model.fromArray(res.data.global_relationships);
        InternalBotModel.Model.fromArray(res.data.internal_bots);

        return {};
    };

    const result = mutate(["get-all-settings"], getAllSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetAllSettings;
