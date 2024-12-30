import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, User } from "@/core/models";

export interface ICardCheckitemAssignedUsersUpdatedRawResponse {
    assigned_members: User.Interface[];
}

export interface IUseCardCheckitemAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemAssignedUsersUpdatedHandlers = ({ callback, projectUID, checkitemUID }: IUseCardCheckitemAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemAssignedUsersUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-assigned-users-updated-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const checkitem = ProjectCheckitem.Model.getModel(checkitemUID);
                if (checkitem) {
                    checkitem.assigned_members = data.assigned_members;
                }
                return {};
            },
        },
    });
};

export default useCardCheckitemAssignedUsersUpdatedHandlers;
