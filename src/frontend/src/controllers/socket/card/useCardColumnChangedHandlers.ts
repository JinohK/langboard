import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardColumnChangedResponse {
    column_uid: string;
    column_name: string;
}

export interface IUseCardColumnChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardColumnChangedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardColumnChangedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardColumnChangedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-column-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED,
            params: { uid: cardUID },
            callback,
        },
    });
};

export default useCardColumnChangedHandlers;
