import { API_ROUTES } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

const useIsSettingsAvailable = (options?: TQueryOptions) => {
    const { query } = useQueryMutation();

    const isSettingsAvailable = async () => {
        const res = await api.post(API_ROUTES.SETTINGS.IS_AVAILABLE);

        return res.data;
    };

    const result = query(["is-settings-available"], isSettingsAvailable, {
        ...options,
        retry: 0,
        refetchInterval: Infinity,
        refetchOnWindowFocus: false,
    });
    return result;
};

export default useIsSettingsAvailable;
