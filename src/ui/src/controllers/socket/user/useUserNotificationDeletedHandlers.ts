import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, UserNotification } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.USER.NOTIFICATION_DELETED,
            callback,
            responseConverter: (data) => {
                UserNotification.Model.deleteModel(data.notification_uid);
                return {};
            },
        },
    });
};

export default useUserNotificationDeletedHandlers;
