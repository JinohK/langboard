import { API_ROUTES } from "@/controllers/constants";
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

interface IUpdateProfileResponse {
    revert_key: string;
}

const useUpdateProfile = (revertCallback?: () => void, options?: TMutationOptions<IUpdateProfileForm, IUpdateProfileResponse>) => {
    const { mutate } = useQueryMutation();
    const { revert, createToastButton: createRevertToastButton } = useRevert(API_ROUTES.ACCOUNT.UPDATE_PROFILE, revertCallback);

    const updateProfile = async (params: IUpdateProfileForm) => {
        const formData = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            if (key === "avatar") {
                formData.append(key, value, value.name);
            } else {
                formData.append(key, value);
            }
        });

        const res = await api.put(API_ROUTES.ACCOUNT.UPDATE_PROFILE, formData);

        return res.data;
    };

    const result = mutate(["update-profile"], updateProfile, {
        ...options,
        retry: 0,
    });

    return {
        ...result,
        revert,
        createRevertToastButton,
    };
};

export default useUpdateProfile;
