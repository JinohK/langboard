/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel } from "@/core/models";
import { Utils } from "@langboard/core/utils";

const useDeleteSetting = (setting: AppSettingModel.TModel, options?: TMutationOptions<unknown>) => {
    const { mutate } = useQueryMutation();

    const deleteSetting = async () => {
        const url = Utils.String.format(Routing.API.SETTINGS.DELETE, { uid: setting.uid });
        const res = await api.delete(url, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        AppSettingModel.Model.deleteModel(setting.uid);

        return res.data;
    };

    const result = mutate(["delete-setting"], deleteSetting, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSetting;
