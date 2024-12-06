import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardColumnChangedResponse {
    column_uid: string;
    column_name: string;
}

export interface IUseCardColumnChangedHandlersProps extends IBaseUseSocketHandlersProps<ICardColumnChangedResponse> {
    cardUID: string;
}

interface IUseCardColumnChangedHandlers {
    (props: IUseCardColumnChangedHandlersProps): {
        on: () => { off: () => void };
    };
}

const useCardColumnChangedHandlers: IUseCardColumnChangedHandlers = ({ socket, callback, cardUID }) => {
    return useSocketHandler({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED,
            params: { uid: cardUID },
            callback,
        },
        sendProps: {
            name: "",
        },
    });
};

export default useCardColumnChangedHandlers;
