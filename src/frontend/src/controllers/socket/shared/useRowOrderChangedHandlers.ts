import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IRowOrderChangedRequest extends IModelIdBase {}

export interface IRowOrderChangedResponse {
    move_type: "from_column" | "to_column" | "in_column";
    uid: string;
    order: number;
}

export interface IUseRowOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IRowOrderChangedResponse> {
    type: "BoardCard" | "BoardCardSubCheckitem";
    params?: Record<string, string>;
}

const useRowOrderChangedHandlers = ({ socket, callback, type, params }: IUseRowOrderChangedHandlersProps) => {
    let onEventName = "";
    let sendEventName = "";
    switch (type) {
        case "BoardCard":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED;
            sendEventName = SOCKET_CLIENT_EVENTS.BOARD.CARD.ORDER_CHANGED;
            break;
        case "BoardCardSubCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.SUB_CHECKITEM.ORDER_CHANGED;
            sendEventName = SOCKET_CLIENT_EVENTS.BOARD.CARD.SUB_CHECKITEM.ORDER_CHANGED;
            break;
    }

    return useSocketHandler<IRowOrderChangedRequest, IRowOrderChangedResponse>({
        socket,
        onProps: {
            name: onEventName,
            params,
            callback,
        },
        sendProps: {
            name: sendEventName,
        },
    });
};

export default useRowOrderChangedHandlers;
