import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardDeadlineChangedRequest {}

export interface ICardDeadlineChangedResponse {
    deadline_at: Date;
}

export interface IUseCardDeadlineChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardDeadlineChangedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardDeadlineChangedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardDeadlineChangedHandlersProps) => {
    return useSocketHandler<ICardDeadlineChangedRequest, ICardDeadlineChangedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-deadline-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DEADLINE_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (response) => ({
                ...response,
                deadline_at: new Date(response.deadline_at),
            }),
        },
    });
};

export default useCardDeadlineChangedHandlers;
