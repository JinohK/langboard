import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCheckitemDeletedRequest {}

export interface ICardCheckitemDeletedResponse {
    uid: string;
}

export interface IUseCardCheckitemDeletedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemDeletedResponse> {
    projectUID: string;
    uid: string;
}

const useCardCheckitemDeletedHandlers = ({ socket, callback, projectUID, uid }: IUseCardCheckitemDeletedHandlersProps) => {
    return useSocketHandler<ICardCheckitemDeletedRequest, ICardCheckitemDeletedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-checkitem-deleted-${uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.DELETED,
            params: { uid },
            callback,
        },
    });
};

export default useCardCheckitemDeletedHandlers;
