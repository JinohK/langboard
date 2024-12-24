import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCheckitemTimerStoppedResponse {
    acc_time_seconds: number;
}

export interface IUseCardCheckitemTimerStoppedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemTimerStoppedResponse> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemTimerStoppedHandlers = ({ socket, callback, projectUID, checkitemUID }: IUseCardCheckitemTimerStoppedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-timer-stopped-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.TIMER_STOPPED,
            params: { uid: checkitemUID },
            callback,
        },
    });
};

export default useCardCheckitemTimerStoppedHandlers;
