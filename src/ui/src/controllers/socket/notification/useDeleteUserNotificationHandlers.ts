import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

const useDeleteUserNotificationHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "delete-user-notification",
        onProps: {
            name: SocketEvents.CLIENT.USER.DELETE_NOTIFICATION,
        },
        sendProps: {
            name: SocketEvents.CLIENT.USER.DELETE_NOTIFICATION,
        },
    });
};

export default useDeleteUserNotificationHandlers;
