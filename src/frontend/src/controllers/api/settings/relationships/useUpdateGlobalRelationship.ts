import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

export interface IUpdateGlobalRelationshipForm {
    parent_name?: string;
    child_name?: string;
    description?: string;
}

const useUpdateGlobalRelationship = (
    globalRelationship: GlobalRelationshipType.TModel,
    options?: TMutationOptions<IUpdateGlobalRelationshipForm>
) => {
    const { mutate } = useQueryMutation();

    const updateGlobalRelationship = async (params: IUpdateGlobalRelationshipForm) => {
        const url = format(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.UPDATE, { uid: globalRelationship.uid });
        const res = await api.put(url, {
            ...params,
        });

        return res.data;
    };

    const result = mutate(["update-global-relationship"], updateGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useUpdateGlobalRelationship;
