import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { AppSettingModel } from "@/core/models";
import { ESettingType } from "@/core/models/AppSettingModel";

export interface ICreateSettingForm {
    setting_type: ESettingType;
    setting_name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setting_value: any;
}

export interface ICreateSettingResponse extends IRevertKeyBaseResponse {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    revealed_value: any;
}

const useCreateSetting = (options?: TMutationOptions<ICreateSettingForm, ICreateSettingResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert<string>(API_ROUTES.SETTINGS.CREATE, (settingUID) => {
        AppSettingModel.Model.deleteModel(settingUID);
    });

    const createSetting = async (params: ICreateSettingForm) => {
        const res = await api.post(API_ROUTES.SETTINGS.CREATE, {
            setting_type: params.setting_type,
            setting_name: params.setting_name,
            setting_value: params.setting_value,
        });

        AppSettingModel.Model.fromObject(res.data.setting, true);

        return {
            revealed_value: res.data.revealed_value,
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, res.data.setting.uid),
        };
    };

    const result = mutate(["create-setting"], createSetting, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateSetting;
