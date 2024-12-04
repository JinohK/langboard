import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardCardOrderChangedResponse {
    column_uid: string;
    column_name: string;
}

export interface IUseBoardCardOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardCardOrderChangedResponse> {
    cardUID: string;
}

interface IUseBoardCardOrderChangedHandlers {
    (props: IUseBoardCardOrderChangedHandlersProps): {
        on: () => { off: () => void };
    };
}

const useBoardCardOrderChangedHandlers: IUseBoardCardOrderChangedHandlers = ({ socket, callback, cardUID }) => {
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

export default useBoardCardOrderChangedHandlers;
