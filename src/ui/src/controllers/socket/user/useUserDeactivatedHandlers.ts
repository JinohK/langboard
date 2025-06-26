import { Toast } from "@/components/base";
import { API_ROUTES, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { api } from "@/core/helpers/Api";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser } from "@/core/models";
import { cleanModels } from "@/core/models/Base";
import { getAuthStore } from "@/core/stores/AuthStore";
import { t } from "i18next";

export interface IUseUserDeactivatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    currentUser: AuthUser.TModel;
}

const useUserDeactivatedHandlers = ({ currentUser, callback }: IUseUserDeactivatedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.UserPrivate,
        topicId: currentUser.uid,
        eventKey: `user-deactivated-${currentUser.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.USER.DEACTIVATED,
            params: { uid: currentUser.uid },
            callback,
            responseConverter: async () => {
                await api.post(API_ROUTES.AUTH.SIGN_OUT);
                cleanModels();
                getAuthStore().removeToken();
                Toast.Add.error(t("auth.You have been deactivated."));
                return {};
            },
        },
    });
};

export default useUserDeactivatedHandlers;
