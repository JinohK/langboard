import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitemTimer } from "@/core/models";

export interface ICardCheckitemTimerStartedRequest {}

export interface ICardCheckitemTimerStartedResponse {
    timer: ProjectCheckitemTimer.Interface;
    acc_time_seconds: number;
}

export interface IUseCardCheckitemTimerStartedHandlersProps extends IBaseUseSocketHandlersProps<ICardCheckitemTimerStartedResponse> {
    projectUID: string;
    checkitemUID: string;
}

const useCardCheckitemTimerStartedHandlers = ({ socket, callback, projectUID, checkitemUID }: IUseCardCheckitemTimerStartedHandlersProps) => {
    return useSocketHandler<ICardCheckitemTimerStartedRequest, ICardCheckitemTimerStartedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-timer-started-${checkitemUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.TIMER_STARTED,
            params: { uid: checkitemUID },
            callback,
            responseConverter: (response) => ({
                ...response,
                timer: ProjectCheckitemTimer.transformFromApi(response.timer),
            }),
        },
    });
};

export default useCardCheckitemTimerStartedHandlers;
