/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateSettingForm {
    setting_name?: string;

    setting_value?: any;
}

const useUpdateSetting = (setting: AppSettingModel.TModel, options?: TMutationOptions<IUpdateSettingForm>) => {
    const { mutate } = useQueryMutation();

    const updateSetting = async (params: IUpdateSettingForm) => {
        const url = format(API_ROUTES.SETTINGS.UPDATE, { uid: setting.uid });
        const res = await api.put(
            url,
            {
                setting_name: params.setting_name,
                setting_value: params.setting_value,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        AppSettingModel.Model.fromOne({
            uid: setting.uid,
            ...res.data,
        });

        return res.data;
    };

    const result = mutate(["update-setting"], updateSetting, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateSetting;
