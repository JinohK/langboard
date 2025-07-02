import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import useSocketHandler from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

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
