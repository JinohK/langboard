import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitemTimer } from "@/core/models";

export interface ICardCheckitemTimerStartedRequest extends IModelIdBase {}

export interface ICardCheckitemTimerStartedResponse {
    timer: ProjectCheckitemTimer.Interface;
    acc_time_seconds: number;
}

export interface IUseCardCheckitemTimerStartedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemTimerStartedResponse> {
    checkitemUID?: string;
}

const useCardCheckitemTimerStartedHandlers = ({ socket, callback, checkitemUID }: IUseCardCheckitemTimerStartedHandlersProps) => {
    return useSocketHandler<ICardCheckitemTimerStartedRequest, ICardCheckitemTimerStartedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.TIMER_STARTED,
            params: checkitemUID ? { uid: checkitemUID } : undefined,
            callback,
            responseConverter: (response) => ({
                ...response,
                timer: ProjectCheckitemTimer.transformFromApi(response.timer),
            }),
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.CHECKITEM.TIMER_STARTED,
        },
    });
};

export default useCardCheckitemTimerStartedHandlers;
