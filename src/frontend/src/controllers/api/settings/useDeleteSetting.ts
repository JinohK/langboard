import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { AppSettingModel } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteSetting = (setting: AppSettingModel.TModel, options?: TMutationOptions<unknown, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.SETTINGS.DELETE, { uid: setting.uid });
    const { createToastCreator } = useRevert(url, () => {
        AppSettingModel.Model.addModel(setting, true);
    });

    const deleteSetting = async () => {
        const res = await api.delete(url);

        AppSettingModel.Model.deleteModel(setting.uid);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, undefined),
        };
    };

    const result = mutate(["delete-setting"], deleteSetting, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSetting;
