import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteGlobalRelationship = (globalRelationship: GlobalRelationshipType.TModel, options?: TMutationOptions) => {
    const { mutate } = useQueryMutation();

    const deleteGlobalRelationship = async () => {
        const url = format(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.DELETE, { uid: globalRelationship.uid });
        const res = await api.delete(url);

        GlobalRelationshipType.Model.deleteModel(globalRelationship.uid);

        return res.data;
    };

    const result = mutate(["delete-global-relationship"], deleteGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteGlobalRelationship;
