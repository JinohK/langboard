/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel } from "@/core/models";
import { ESettingType } from "@/core/models/AppSettingModel";

export interface ICreateSettingForm {
    setting_type: ESettingType;
    setting_name: string;

    setting_value: any;
}

export interface ICreateSettingResponse {
    revealed_value: any;
}

const useCreateSetting = (options?: TMutationOptions<ICreateSettingForm, ICreateSettingResponse>) => {
    const { mutate } = useQueryMutation();

    const createSetting = async (params: ICreateSettingForm) => {
        const res = await api.post(
            Routing.API.SETTINGS.CREATE,
            {
                setting_type: params.setting_type,
                setting_name: params.setting_name,
                setting_value: params.setting_value,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        AppSettingModel.Model.fromOne(res.data.setting, true);

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
