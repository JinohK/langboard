import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCheckitemDeletedRequest {
    parent_uid: string;
    checkitem_uid: string;
}

export interface ICardCheckitemDeletedResponse {
    uid: string;
}

export interface IUseCardCheckitemDeletedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemDeletedResponse> {
    uid?: string;
}

const useCardCheckitemDeletedHandlers = ({ socket, callback, uid }: IUseCardCheckitemDeletedHandlersProps) => {
    return useSocketHandler<ICardCheckitemDeletedRequest, ICardCheckitemDeletedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.DELETED,
            params: uid ? { uid } : undefined,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CHECKITEM.DELETED,
        },
    });
};

export default useCardCheckitemDeletedHandlers;
