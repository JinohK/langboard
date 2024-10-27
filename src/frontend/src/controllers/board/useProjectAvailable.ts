import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IProjectAvailableForm {
    uid: string;
}

const useProjectAvailable = (options?: TMutationOptions<IProjectAvailableForm>) => {
    const { mutate } = useQueryMutation();

    const isProjectAvailable = async (params: IProjectAvailableForm) => {
        const url = format(API_ROUTES.BOARD.IS_AVAILABLE, { uid: params.uid });
        const res = await api.post(url);

        return res.data;
    };

    const result = mutate(["is-project-available"], isProjectAvailable, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useProjectAvailable;
