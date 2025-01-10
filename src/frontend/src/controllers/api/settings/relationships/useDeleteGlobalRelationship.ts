import { IRevertKeyBaseResponse } from "@/controllers/api/revert/useRevertMutate";
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import useRevert from "@/core/hooks/useRevert";
import { GlobalRelationshipType } from "@/core/models";
import { format } from "@/core/utils/StringUtils";

const useDeleteGlobalRelationship = (
    globalRelationship: GlobalRelationshipType.TModel,
    options?: TMutationOptions<unknown, IRevertKeyBaseResponse>
) => {
    const { mutate } = useQueryMutation();
    const url = format(API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.DELETE, { uid: globalRelationship.uid });
    const { createToastCreator } = useRevert(url, () => {
        GlobalRelationshipType.Model.addModel(globalRelationship, true);
    });

    const deleteGlobalRelationship = async () => {
        const res = await api.delete(url);

        GlobalRelationshipType.Model.deleteModel(globalRelationship.uid);

        return {
            revert_key: res.data.revert_key,
            createToast: createToastCreator(res.data.revert_key, undefined),
        };
    };

    const result = mutate(["delete-global-relationship"], deleteGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useDeleteGlobalRelationship;
