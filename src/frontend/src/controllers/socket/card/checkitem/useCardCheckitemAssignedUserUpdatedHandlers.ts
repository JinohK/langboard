import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";

export interface ICardCheckitemAssignedUsersUpdatedResponse {
    assigned_members: User.Interface[];
}

export interface IUseCardCheckitemAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemAssignedUsersUpdatedResponse> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemAssignedUsersUpdatedHandlers = ({
    socket,
    callback,
    projectUID,
    checkitemUID,
}: IUseCardCheckitemAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-assigned-users-updated-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (response) => {
                User.transformFromApi(response.assigned_members);
                return response;
            },
        },
    });
};

export default useCardCheckitemAssignedUsersUpdatedHandlers;
