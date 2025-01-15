import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler from "@/core/helpers/SocketHandler";

const useReadUserNotificationHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "read-user-notification",
        onProps: {
            name: SOCKET_CLIENT_EVENTS.USER.READ_NOTIFICATION,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.USER.READ_NOTIFICATION,
        },
    });
};

export default useReadUserNotificationHandlers;
