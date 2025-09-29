import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

const useReadAllUserNotificationsHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "read-all-user-notifications",
        onProps: {
            name: SocketEvents.CLIENT.USER.READ_ALL_NOTIFICATIONS,
        },
        sendProps: {
            name: SocketEvents.CLIENT.USER.READ_ALL_NOTIFICATIONS,
        },
    });
};

export default useReadAllUserNotificationsHandlers;
