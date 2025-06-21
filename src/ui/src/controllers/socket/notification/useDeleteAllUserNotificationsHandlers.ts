import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler from "@/core/helpers/SocketHandler";

const useDeleteAllUserNotificationsHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "delete-all-user-notifications",
        onProps: {
            name: SOCKET_CLIENT_EVENTS.USER.DELETE_ALL_NOTIFICATIONS,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.USER.DELETE_ALL_NOTIFICATIONS,
        },
    });
};

export default useDeleteAllUserNotificationsHandlers;
