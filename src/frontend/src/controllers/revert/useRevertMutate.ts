import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

interface IRevertForm {
    revert_key: string;
}

const useRevertMutate = (path: string, options?: TMutationOptions<IRevertForm>) => {
    if (path.startsWith("/")) {
        path = path.slice(1);
    }

    const { mutate } = useQueryMutation();

    const revert = async (params: IRevertForm) => {
        const url = API_ROUTES.REVERT(path);
        const res = await api.post(url, params);

        return res.data;
    };

    const result = mutate([`revert-${path.replace(/\//g, "-")}`], revert, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useRevertMutate;
