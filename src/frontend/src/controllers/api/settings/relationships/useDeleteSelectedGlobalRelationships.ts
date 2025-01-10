import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { GlobalRelationshipType } from "@/core/models";

export interface IDeleteSelectedGlobalRelationshipsForm {
    relationship_type_uids: string[];
}

const useDeleteSelectedGlobalRelationships = (options?: TMutationOptions<IDeleteSelectedGlobalRelationshipsForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert<GlobalRelationshipType.TModel[]>(API_ROUTES.SETTINGS.DELETE_SELECTED, (relationships) => {
        GlobalRelationshipType.Model.addModels(relationships, true);
    });

    const deleteSelectedGlobalRelationships = async (params: IDeleteSelectedGlobalRelationshipsForm) => {
        const originalGlobalRelationships = GlobalRelationshipType.Model.getModels(params.relationship_type_uids);

        const res = await api.delete(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.DELETE_SELECTED, {
            data: params,
        });

        GlobalRelationshipType.Model.deleteModels(params.relationship_type_uids);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, originalGlobalRelationships),
        };
    };

    const result = mutate(["delete-selected-global-relationship"], deleteSelectedGlobalRelationships, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteSelectedGlobalRelationships;
