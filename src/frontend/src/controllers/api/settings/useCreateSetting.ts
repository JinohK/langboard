import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel } from "@/core/models";
import { ESettingType } from "@/core/models/AppSettingModel";

export interface ICreateSettingForm {
    setting_type: ESettingType;
    setting_name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setting_value: any;
}

export interface ICreateSettingResponse {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    revealed_value: any;
}

const useCreateSetting = (options?: TMutationOptions<ICreateSettingForm, ICreateSettingResponse>) => {
    const { mutate } = useQueryMutation();

    const createSetting = async (params: ICreateSettingForm) => {
        const res = await api.post(API_ROUTES.SETTINGS.CREATE, {
            setting_type: params.setting_type,
            setting_name: params.setting_name,
            setting_value: params.setting_value,
        });

        AppSettingModel.Model.fromObject(res.data.setting, true);

        return {
            revealed_value: res.data.revealed_value,
        };
    };

    const result = mutate(["create-setting"], createSetting, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateSetting;
