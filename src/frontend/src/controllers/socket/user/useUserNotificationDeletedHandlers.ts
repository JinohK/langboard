import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, UserNotification } from "@/core/models";

export interface IUserNotificationDeletedRawResponse {
    notification_uid: string;
}

export interface IUseUserNotificationDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    currentUser: AuthUser.TModel;
}

const useUserNotificationDeletedHandlers = ({ callback, currentUser }: IUseUserNotificationDeletedHandlersProps) => {
    return useSocketHandler<{}, IUserNotificationDeletedRawResponse>({
        topic: ESocketTopic.UserPrivate,
        topicId: currentUser.uid,
        eventKey: `user-notification-deleted-${currentUser.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.USER.NOTIFICATION_DELETED,
            callback,
            responseConverter: (data) => {
                UserNotification.Model.deleteModel(data.notification_uid);
                return {};
            },
        },
    });
};

export default useUserNotificationDeletedHandlers;
