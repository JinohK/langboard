import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";

export interface ICardAssignedUsersUpdatedRawResponse {
    member_uids: string[];
}

export interface IUseCardAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardAssignedUsersUpdatedHandlers = ({ callback, projectUID, cardUID }: IUseCardAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardAssignedUsersUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-assigned-users-updated-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ASSIGNED_USERS_UPDATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    card.member_uids = data.member_uids;
                }
                return {};
            },
        },
    });
};

export default useCardAssignedUsersUpdatedHandlers;
