import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel, BotModel, GlobalRelationshipType } from "@/core/models";

const useGetAllSettings = (options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const getAllSettings = async () => {
        const res = await api.get(API_ROUTES.SETTINGS.GET_ALL);

        AppSettingModel.Model.fromObjectArray(res.data.settings);
        BotModel.Model.fromObjectArray(res.data.bots);
        GlobalRelationshipType.Model.fromObjectArray(res.data.global_relationships);

        return {};
    };

    const result = mutate(["get-all-settings"], getAllSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetAllSettings;
