import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { StringCase } from "@/core/utils/StringUtils";

export interface IRowOrderChangedRequest {}

export interface IRowOrderChangedResponse {
    move_type: "from_column" | "to_column" | "in_column";
    uid: string;
    order: number;
}

export interface IUseRowOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IRowOrderChangedResponse> {
    type: "BoardCard" | "BoardCardSubCheckitem";
    params?: Record<string, string>;
    topicId: string;
}

const useRowOrderChangedHandlers = ({ socket, callback, type, params, topicId }: IUseRowOrderChangedHandlersProps) => {
    let onEventName = "";
    const sendEventName = "";
    let topic = ESocketTopic.None;
    switch (type) {
        case "BoardCard":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED;
            topic = ESocketTopic.Board;
            break;
        case "BoardCardSubCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.SUB_CHECKITEM.ORDER_CHANGED;
            topic = ESocketTopic.Board;
            break;
    }

    return useSocketHandler<IRowOrderChangedRequest, IRowOrderChangedResponse>({
        socket,
        topic,
        id: topicId,
        eventKey: `${new StringCase(type).toKebab()}-row-order-changed`,
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
