import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, UserNotification } from "@/core/models";

export interface IUserNotifiedRawResponse {
    notification: UserNotification.Interface;
}

export interface IUseUserNotifiedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    currentUser: AuthUser.TModel;
}

const useUserNotifiedHandlers = ({ callback, currentUser }: IUseUserNotifiedHandlersProps) => {
    return useSocketHandler<{}, IUserNotifiedRawResponse>({
        topic: ESocketTopic.UserPrivate,
        topicId: currentUser.uid,
        eventKey: `user-notified-${currentUser.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.USER.NOTIFIED,
            callback,
            responseConverter: (data) => {
                UserNotification.Model.fromObject(data.notification, true);
                return {};
            },
        },
    });
};

export default useUserNotifiedHandlers;
