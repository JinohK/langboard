import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { GlobalRelationshipType } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateGlobalRelationshipForm {
    parent_name?: string;
    child_name?: string;
    description?: string;
}

const useUpdateGlobalRelationship = (
    globalRelationship: GlobalRelationshipType.TModel,
    options?: TMutationOptions<IUpdateGlobalRelationshipForm, IRevertKeyBaseResponse>
) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.UPDATE, { uid: globalRelationship.uid });
    const { createToastCreator } = useRevert<Partial<GlobalRelationshipType.Interface>>(url, (originalValues) => {
        GlobalRelationshipType.Model.fromObject({
            uid: globalRelationship.uid,
            ...originalValues,
        });
    });

    const updateGlobalRelationship = async (params: IUpdateGlobalRelationshipForm) => {
        const res = await api.put(url, {
            ...params,
        });

        const originalValues: Partial<GlobalRelationshipType.Interface> = {};
        Object.entries(params).forEach(([key, value]) => {
            originalValues[key] = globalRelationship[key];
            globalRelationship[key] = value!;
        });

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, originalValues),
        };
    };

    const result = mutate(["update-global-relationship"], updateGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateGlobalRelationship;
