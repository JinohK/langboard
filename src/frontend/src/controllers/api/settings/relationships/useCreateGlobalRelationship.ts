/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { GlobalRelationshipType } from "@/core/models";

export interface ICreateGlobalRelationshipForm {
    parent_name: string;
    child_name: string;
    description?: string;
}

const useCreateGlobalRelationship = (options?: TMutationOptions<ICreateGlobalRelationshipForm>) => {
    const { mutate } = useQueryMutation();

    const createGlobalRelationship = async (params: ICreateGlobalRelationshipForm) => {
        const res = await api.post(
            API_ROUTES.SETTINGS.GLOBAL_RELATIONSHIPS.CREATE,
            {
                ...params,
            },
            {
                env: {
                    interceptToast: options?.interceptToast,
                } as any,
            }
        );

        GlobalRelationshipType.Model.fromObject(res.data.global_relationship, true);

        return res.data;
    };

    const result = mutate(["create-global-relationship"], createGlobalRelationship, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useCreateGlobalRelationship;
