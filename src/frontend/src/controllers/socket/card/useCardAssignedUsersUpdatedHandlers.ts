import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";

export interface ICardAssignedUsersUpdatedResponse {
    assigned_members: User.Interface[];
}

export interface IUseCardAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<ICardAssignedUsersUpdatedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardAssignedUsersUpdatedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-assigned-users-updated-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ASSIGNED_USERS_UPDATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (response) => {
                User.transformFromApi(response.assigned_members);
                return response;
            },
        },
    });
};

export default useCardAssignedUsersUpdatedHandlers;
