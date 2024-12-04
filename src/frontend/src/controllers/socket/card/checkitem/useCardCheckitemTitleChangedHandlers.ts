import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCheckitemTitleChangedRequest {
    checkitem_uid: string;
    title: string;
}

export interface ICardCheckitemTitleChangedResponse {
    title: string;
}

export interface IUseCardCheckitemTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemTitleChangedResponse> {
    checkitemUID?: string;
}

const useCardCheckitemTitleChangedHandlers = ({ socket, callback, checkitemUID }: IUseCardCheckitemTitleChangedHandlersProps) => {
    return useSocketHandler<ICardCheckitemTitleChangedRequest, ICardCheckitemTitleChangedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.TITLE_CHANGED,
            params: checkitemUID ? { uid: checkitemUID } : undefined,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CHECKITEM.TITLE_CHANGED,
        },
    });
};

export default useCardCheckitemTitleChangedHandlers;
