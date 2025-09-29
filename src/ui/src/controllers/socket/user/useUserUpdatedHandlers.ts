import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User, AuthUser } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

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
        eventKey: `user-updated-${user.uid}`,
        onProps: {
            name: SocketEvents.SERVER.USER.UPDATED,
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
