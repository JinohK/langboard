import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { format } from "@/core/utils/StringUtils";

export interface IIsProjectAvailableForm {
    uid: string;
}

export interface IIsProjectAvailableResponse {
    title: string;
}

const useIsProjectAvailable = (form: IIsProjectAvailableForm, options?: TQueryOptions<unknown, IIsProjectAvailableResponse>) => {
    const { query } = useQueryMutation();

    const isProjectAvailable = async () => {
        const url = format(API_ROUTES.BOARD.IS_AVAILABLE, { uid: form.uid });
        const res = await api.post(url);

        return res.data;
    };

    const result = query(["is-project-available"], isProjectAvailable, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useIsProjectAvailable;
