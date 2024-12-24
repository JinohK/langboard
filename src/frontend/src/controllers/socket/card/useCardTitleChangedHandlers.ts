import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardTitleChangedResponse {
    title: string;
}

export interface IUseCardTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardTitleChangedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardTitleChangedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardTitleChangedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-title-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.TITLE_CHANGED,
            params: { uid: cardUID },
            callback,
        },
    });
};

export default useCardTitleChangedHandlers;
