import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";

export interface IDeleteSelectedGlobalRelationshipsForm {
    relationship_type_uids: string[];
}

const useDeleteSelectedGlobalRelationships = (options?: TMutationOptions<IDeleteSelectedGlobalRelationshipsForm>) => {
    const { mutate } = useQueryMutation();

    const deleteSelectedGlobalRelationships = async (params: IDeleteSelectedGlobalRelationshipsForm) => {
        const res = await api.delete(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.DELETE_SELECTED, {
            data: params,
        });

        GlobalRelationshipType.Model.deleteModels(params.relationship_type_uids);

        return res.data;
    };

    const result = mutate(["delete-selected-global-relationship"], deleteSelectedGlobalRelationships, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedGlobalRelationships;
