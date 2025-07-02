import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import useSocketHandler from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

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
