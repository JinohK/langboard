import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardDeadlineChangedRequest extends IModelIdBase {}

export interface ICardDeadlineChangedResponse {
    deadline_at: Date;
}

export interface IUseCardDeadlineChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardDeadlineChangedResponse> {
    cardUID: string;
}

const useCardDeadlineChangedHandlers = ({ socket, callback, cardUID }: IUseCardDeadlineChangedHandlersProps) => {
    return useSocketHandler<ICardDeadlineChangedRequest, ICardDeadlineChangedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DEADLINE_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (response) => ({
                ...response,
                deadline_at: new Date(response.deadline_at),
            }),
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.DETAILS_CHANGED,
        },
    });
};

export default useCardDeadlineChangedHandlers;
