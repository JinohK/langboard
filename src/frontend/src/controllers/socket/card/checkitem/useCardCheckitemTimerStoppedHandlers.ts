import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCheckitemTimerStoppedRequest {
    checkitem_uid: string;
    acc_time_seconds: number;
}

export interface ICardCheckitemTimerStoppedResponse {
    acc_time_seconds: number;
}

export interface IUseCardCheckitemTimerStoppedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemTimerStoppedResponse> {
    checkitemUID?: string;
}

const useCardCheckitemTimerStoppedHandlers = ({ socket, callback, checkitemUID }: IUseCardCheckitemTimerStoppedHandlersProps) => {
    return useSocketHandler<ICardCheckitemTimerStoppedRequest, ICardCheckitemTimerStoppedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.TIMER_STOPPED,
            params: checkitemUID ? { uid: checkitemUID } : undefined,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CHECKITEM.TIMER_STOPPED,
        },
    });
};

export default useCardCheckitemTimerStoppedHandlers;
