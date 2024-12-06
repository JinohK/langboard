import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IColumnOrderChangedRequest extends IModelIdBase {}

export interface IColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IColumnOrderChangedResponse> {
    type: "BoardColumn" | "BoardCardAttachment" | "BoardCardCheckitem";
    params?: Record<string, string>;
}

const useColumnOrderChangedHandlers = ({ socket, callback, type, params }: IUseColumnOrderChangedHandlersProps) => {
    let onEventName = "";
    let sendEventName = "";
    switch (type) {
        case "BoardColumn":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.COLUMN_ORDER_CHANGED;
            sendEventName = SOCKET_CLIENT_EVENTS.BOARD.COLUMN_ORDER_CHANGED;
            break;
        case "BoardCardAttachment":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.ORDER_CHANGED;
            sendEventName = SOCKET_CLIENT_EVENTS.BOARD.CARD.ATTACHMENT.ORDER_CHANGED;
            break;
        case "BoardCardCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.ORDER_CHANGED;
            sendEventName = SOCKET_CLIENT_EVENTS.BOARD.CARD.CHECKITEM.ORDER_CHANGED;
            break;
    }

    return useSocketHandler<IColumnOrderChangedRequest, IColumnOrderChangedResponse>({
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

export default useColumnOrderChangedHandlers;
