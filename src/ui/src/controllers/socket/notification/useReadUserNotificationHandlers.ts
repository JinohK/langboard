import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

const useReadUserNotificationHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "read-user-notification",
        onProps: {
            name: SocketEvents.CLIENT.USER.READ_NOTIFICATION,
        },
        sendProps: {
            name: SocketEvents.CLIENT.USER.READ_NOTIFICATION,
        },
    });
};

export default useReadUserNotificationHandlers;
