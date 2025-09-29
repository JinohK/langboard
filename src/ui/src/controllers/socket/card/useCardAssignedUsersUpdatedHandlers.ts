import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.BOARD.CARD.ASSIGNED_USERS_UPDATED,
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
