import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { AppSettingModel } from "@/core/models";

export interface IDeleteSelectedSettingsForm {
    setting_uids: string[];
}

const useDeleteSelectedSettings = (options?: TMutationOptions<IDeleteSelectedSettingsForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert<AppSettingModel.TModel[]>(API_ROUTES.SETTINGS.DELETE_SELECTED, (settings) => {
        AppSettingModel.Model.addModels(settings, true);
    });

    const deleteSelectedSettings = async (params: IDeleteSelectedSettingsForm) => {
        const originalSettings = AppSettingModel.Model.getModels(params.setting_uids);

        const res = await api.delete(API_ROUTES.SETTINGS.DELETE_SELECTED, {
            data: params,
        });

        AppSettingModel.Model.deleteModels(params.setting_uids);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, originalSettings),
        };
    };

    const result = mutate(["delete-selected-settings"], deleteSelectedSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedSettings;
