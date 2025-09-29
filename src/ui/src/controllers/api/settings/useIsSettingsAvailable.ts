/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TQueryOptions, useQueryMutation } from "@/core/helpers/QueryMutation";

const useIsSettingsAvailable = (options?: TQueryOptions) => {
    const { query } = useQueryMutation();

    const isSettingsAvailable = async () => {
        const res = await api.post(Routing.API.SETTINGS.IS_AVAILABLE, {
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

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
