import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { StringCase } from "@/core/utils/StringUtils";

export interface IColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IColumnOrderChangedResponse> {
    type: "ProjectColumn" | "BoardCardAttachment" | "BoardCardCheckitem" | "BoardWiki" | "ProjectLabel";
    params?: Record<string, string>;
    topicId: string;
}

const useColumnOrderChangedHandlers = ({ socket, callback, type, params, topicId }: IUseColumnOrderChangedHandlersProps) => {
    let onEventName = "";
    const sendEventName = "";
    let topic = ESocketTopic.None;
    switch (type) {
        case "ProjectColumn":
            onEventName = SOCKET_SERVER_EVENTS.PROJECT.COLUMN.ORDER_CHANGED;
            topic = ESocketTopic.Project;
            break;
        case "BoardCardAttachment":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.ORDER_CHANGED;
            topic = ESocketTopic.BoardCard;
            break;
        case "BoardCardCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.ORDER_CHANGED;
            topic = ESocketTopic.Board;
            break;
        case "BoardWiki":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.WIKI.ORDER_CHANGED;
            topic = ESocketTopic.BoardWiki;
            break;
        case "ProjectLabel":
            onEventName = SOCKET_SERVER_EVENTS.PROJECT.LABEL.ORDER_CHANGED;
            topic = ESocketTopic.Project;
            break;
    }

    return useSocketHandler({
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
