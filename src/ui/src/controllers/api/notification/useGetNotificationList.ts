/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routing } from "@langboard/core/constants";
import { api } from "@/core/helpers/Api";
import { TMutationOptions, useQueryMutation } from "@/core/helpers/QueryMutation";
import { UserNotification } from "@/core/models";
import { IUserSettings } from "@/core/stores/UserSettingsStore";

export interface IGetNotificationListForm {
    time_range?: IUserSettings["notifications_time_range"];
}

export interface IGetNotificationListResponse {
    notifications: UserNotification.TModel[];
}

const useGetNotificationList = (options?: TMutationOptions<IGetNotificationListForm, IGetNotificationListResponse>) => {
    const { mutate } = useQueryMutation();

    const toggleAllScopedByTypeNotificationSettings = async (params: IGetNotificationListForm) => {
        const res = await api.get(Routing.API.NOTIFICATION.GET_LIST, {
            params: {
                time_range: params.time_range || "3",
            },
            env: {
                interceptToast: options?.interceptToast,
            } as any,
        });

        UserNotification.Model.fromArray(res.data.notifications || [], true);

        return res.data;
    };

    const result = mutate(["toggle-all-scoped-by-type-notification-settings"], toggleAllScopedByTypeNotificationSettings, {
        ...options,
        retry: 0,
    });

    return result;
};

export default useGetNotificationList;
