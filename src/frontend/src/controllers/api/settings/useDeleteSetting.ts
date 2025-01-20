import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { AppSettingModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteSetting = (setting: AppSettingModel.TModel, options?: TMutationOptions<unknown>) => {
    const { mutate } = useQueryMutation();

    const deleteSetting = async () => {
        const url = format(API_ROUTES.SETTINGS.DELETE, { uid: setting.uid });
        const res = await api.delete(url);

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
