/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel } from "@/core/models";

export interface IDeleteSelectedSettingsForm {
    setting_uids: string[];
}

const useDeleteSelectedSettings = (options?: TMutationOptions<IDeleteSelectedSettingsForm>) => {
    const { mutate } = useQueryMutation();

    const deleteSelectedSettings = async (params: IDeleteSelectedSettingsForm) => {
        const res = await api.delete(Routing.API.SETTINGS.DELETE_SELECTED, {
            data: params,
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        AppSettingModel.Model.deleteModels(params.setting_uids);

        return res.data;
    };

    const result = mutate(["delete-selected-settings"], deleteSelectedSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedSettings;
