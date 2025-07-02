/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { User } from "@/core/models";
import { Utils } from "@langboard/core/utils";

export interface IUpdateUserInSettingsForm {
    firstname?: string;
    lastname?: string;
    password?: string;
    industry?: string;
    purpose?: string;
    affiliation?: string;
    position?: string;
    is_admin?: bool;
    activate?: bool;
}

const useUpdateUserInSettings = (user: User.TModel, options?: TMutationOptions<IUpdateUserInSettingsForm>) => {
    const { mutate } = useQueryMutation();

    const updateUserInSettings = async (params: IUpdateUserInSettingsForm) => {
        const url = Utils.String.format(API_ROUTES.SETTINGS.USERS.UPDATE, { user_uid: user.uid });
        const res = await api.put(url, params, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        return res.data;
    };

    const result = mutate(["update-user-in-settings"], updateUserInSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateUserInSettings;
