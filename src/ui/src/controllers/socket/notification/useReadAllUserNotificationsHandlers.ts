import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler from "@/core/helpers/SocketHandler";

const useReadAllUserNotificationsHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "read-all-user-notifications",
        onProps: {
            name: SOCKET_CLIENT_EVENTS.USER.READ_ALL_NOTIFICATIONS,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.USER.READ_ALL_NOTIFICATIONS,
        },
    });
};

export default useReadAllUserNotificationsHandlers;
