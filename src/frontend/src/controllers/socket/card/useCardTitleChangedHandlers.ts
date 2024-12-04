import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardTitleChangedRequest {
    card_uid: string;
    title: string;
}

export interface ICardTitleChangedResponse {
    title: string;
}

export interface IUseCardTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardTitleChangedResponse> {
    cardUID: string;
}

const useCardTitleChangedHandlers = ({ socket, callback, cardUID }: IUseCardTitleChangedHandlersProps) => {
    return useSocketHandler<ICardTitleChangedRequest, ICardTitleChangedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.TITLE_CHANGED,
            params: { uid: cardUID },
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.DETAILS_CHANGED,
        },
    });
};

export default useCardTitleChangedHandlers;
