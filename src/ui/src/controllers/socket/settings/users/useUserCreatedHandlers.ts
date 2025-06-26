import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";

export interface IUserCreatedRawResponse {
    user: User.Interface;
}

const useUserCreatedHandlers = ({ callback }: IBaseUseSocketHandlersProps<{}>) => {
    return useSocketHandler<{}, IUserCreatedRawResponse>({
        topic: ESocketTopic.AppSettings,
        topicId: GLOBAL_TOPIC_ID,
        eventKey: "user-created",
        onProps: {
            name: SOCKET_SERVER_EVENTS.SETTINGS.USERS.CREATED,
            callback,
            responseConverter: (data) => {
                User.Model.fromOne(data.user, true);
                return {};
            },
        },
    });
};

export default useUserCreatedHandlers;
