import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface ICanUseProjectSettingsForm {
    uid: string;
}

const useCanUseProjectSettings = (form: ICanUseProjectSettingsForm, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const canUseProjectSettings = async () => {
        const url = format(API_ROUTES.BOARD.CAN_USE_SETTINGS, { uid: form.uid });
        const res = await api.post(url);

        return res.data;
    };

    const result = mutate(["can-use-project-settings"], canUseProjectSettings, {
        ...options,
        retry: 0,
    });
    return result;
};

export default useCanUseProjectSettings;
