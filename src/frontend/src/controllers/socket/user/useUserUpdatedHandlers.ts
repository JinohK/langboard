import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User, AuthUser } from "@/core/models";

export interface IUserUpdatedRawResponse {
    firstname?: string;
    lastname?: string;
    email?: string;
    avatar?: string;
}

export interface IUseUserUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    user: User.TModel;
}

const useUserUpdatedHandlers = ({ callback, user }: IUseUserUpdatedHandlersProps) => {
    const isAuthedUser = !!AuthUser.Model.getModel(user.uid);

    return useSocketHandler<{}, IUserUpdatedRawResponse>({
        topic: ESocketTopic.User,
        topicId: user.uid,
        eventKey: `bot-updated-${user.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.USER.UPDATED,
            callback,
            responseConverter: (data) => {
                if (isAuthedUser) {
                    return {};
                }

                Object.entries(data).forEach(([key, value]) => {
                    user[key] = value!;
                });

                return {};
            },
        },
    });
};

export default useUserUpdatedHandlers;
