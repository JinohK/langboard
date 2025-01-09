import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { AppSettingModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateSettingForm {
    setting_name?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setting_value?: any;
}

const useUpdateSetting = (setting: AppSettingModel.TModel, options?: TMutationOptions<IUpdateSettingForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.SETTINGS.UPDATE, { uid: setting.uid });
    const { createToastCreator } = useRevert<Partial<AppSettingModel.Interface>>(url, (originalValues) => {
        AppSettingModel.Model.fromObject({
            uid: setting.uid,
            ...originalValues,
        });
    });

    const updateSetting = async (params: IUpdateSettingForm) => {
        const res = await api.put(url, {
            setting_name: params.setting_name,
            setting_value: params.setting_value,
        });

        const originalValues = {
            setting_name: setting.setting_name,
            setting_value: setting.setting_value,
        };

        const revertKey = res.data.revert_key;
        delete res.data.revert_key;

        AppSettingModel.Model.fromObject({
            uid: setting.uid,
            ...res.data,
        });

        return {
            revert_key: revertKey,
            createToast: createToastCreator(revertKey, originalValues),
        };
    };

    const result = mutate(["update-setting"], updateSetting, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateSetting;
