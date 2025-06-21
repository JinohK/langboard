import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler from "@/core/helpers/SocketHandler";

const useDeleteUserNotificationHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "delete-user-notification",
        onProps: {
            name: SOCKET_CLIENT_EVENTS.USER.DELETE_NOTIFICATION,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.USER.DELETE_NOTIFICATION,
        },
    });
};

export default useDeleteUserNotificationHandlers;
