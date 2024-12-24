import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, User } from "@/core/models";

export interface ICardCheckitemCardifiedResponse {
    card: ProjectCard.IBoard;
}

export interface IUseCardCheckitemCardifiedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemCardifiedResponse> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemCardifiedHandlers = ({ socket, callback, projectUID, checkitemUID }: IUseCardCheckitemCardifiedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-cardified-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CARDIFIED,
            params: { uid: checkitemUID },
            callback,
            responseConverter: (response) => {
                User.transformFromApi(response.card.members);
                return response;
            },
        },
    });
};

export default useCardCheckitemCardifiedHandlers;
