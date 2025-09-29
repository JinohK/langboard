import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

const useDeleteAllUserNotificationsHandlers = () => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.None,
        eventKey: "delete-all-user-notifications",
        onProps: {
            name: SocketEvents.CLIENT.USER.DELETE_ALL_NOTIFICATIONS,
        },
        sendProps: {
            name: SocketEvents.CLIENT.USER.DELETE_ALL_NOTIFICATIONS,
        },
    });
};

export default useDeleteAllUserNotificationsHandlers;
