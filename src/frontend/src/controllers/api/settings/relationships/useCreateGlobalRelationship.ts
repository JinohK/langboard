import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { GlobalRelationshipType } from "@/core/models";

export interface ICreateGlobalRelationshipForm {
    parent_name: string;
    child_name: string;
    description?: string;
}

const useCreateGlobalRelationship = (options?: TMutationOptions<ICreateGlobalRelationshipForm, IRevertKeyBaseResponse>) => {
    const { mutate } = useQueryMutation();
    const { createToastCreator } = useRevert<string>(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.CREATE, (newGlobalRelationshipUID) => {
        GlobalRelationshipType.Model.deleteModel(newGlobalRelationshipUID);
    });

    const createGlobalRelationship = async (params: ICreateGlobalRelationshipForm) => {
        const res = await api.post(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.CREATE, {
            ...params,
        });

        const globalRelationship = GlobalRelationshipType.Model.fromObject(res.data.global_relationship, true);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, globalRelationship.uid),
        };
    };

    const result = mutate(["create-global-relationship"], createGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateGlobalRelationship;
