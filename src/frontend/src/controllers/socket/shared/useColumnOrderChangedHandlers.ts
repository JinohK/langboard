import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { StringCase } from "@/core/utils/StringUtils";

export interface IColumnOrderChangedRequest {}

export interface IColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IColumnOrderChangedResponse> {
    type: "BoardColumn" | "BoardCardAttachment" | "BoardCardCheckitem" | "BoardWiki";
    params?: Record<string, string>;
    topicId: string;
}

const useColumnOrderChangedHandlers = ({ socket, callback, type, params, topicId }: IUseColumnOrderChangedHandlersProps) => {
    let onEventName = "";
    const sendEventName = "";
    let topic = ESocketTopic.None;
    switch (type) {
        case "BoardColumn":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.COLUMN.ORDER_CHANGED;
            topic = ESocketTopic.Board;
            break;
        case "BoardCardAttachment":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.ORDER_CHANGED;
            topic = ESocketTopic.Board;
            break;
        case "BoardCardCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.ORDER_CHANGED;
            topic = ESocketTopic.Board;
            break;
        case "BoardWiki":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.WIKI.ORDER_CHANGED;
            topic = ESocketTopic.BoardWiki;
            break;
    }

    return useSocketHandler<IColumnOrderChangedRequest, IColumnOrderChangedResponse>({
        socket,
        topic,
        topicId: topicId,
        eventKey: `${new StringCase(type).toKebab()}-column-order-changed`,
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
