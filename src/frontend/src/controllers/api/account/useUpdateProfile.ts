import { API_ROUTES } from "@/controllers/constants";
import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { User } from "@/core/models";

export interface IUpdateProfileForm extends Pick<User.Interface, "firstname" | "lastname"> {
    affiliation?: string;
    position?: string;
    avatar?: File;
    revert_key?: string;
}

const useUpdateProfile = (updatedUser: () => void, options?: TMutationOptions<IUpdateProfileForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert(API_ROUTES.ACCOUNT.UPDATE_PROFILE, updatedUser);

    const updateProfile = async (params: IUpdateProfileForm) => {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            if (key === "avatar") {
                formData.append(key, (value as unknown as File[])[0], (value as unknown as File[])[0].name);
            } else {
                formData.append(key, value);
            }
        });

        const res = await api.put(API_ROUTES.ACCOUNT.UPDATE_PROFILE, formData);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, undefined),
        };
    };

    const result = mutate(["update-profile"], updateProfile, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateProfile;
