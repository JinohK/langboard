import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment, ProjectCheckitem, ProjectColumn, ProjectLabel, ProjectWiki } from "@/core/models";
import { StringCase } from "@/core/utils/StringUtils";

export interface IColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IColumnOrderChangedResponse> {
    type: "ProjectColumn" | "ProjectCardAttachment" | "ProjectCheckitem" | "ProjectWiki" | "ProjectLabel";
    params?: Record<string, string>;
    topicId: string;
}

const useColumnOrderChangedHandlers = ({ callback, type, params, topicId }: IUseColumnOrderChangedHandlersProps) => {
    let onEventName = "";
    const sendEventName = "";
    let targetModel;
    let topic = ESocketTopic.None;
    switch (type) {
        case "ProjectColumn":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.COLUMN.ORDER_CHANGED;
            targetModel = ProjectColumn.Model;
            topic = ESocketTopic.Board;
            break;
        case "ProjectCardAttachment":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ATTACHMENT.ORDER_CHANGED;
            targetModel = ProjectCardAttachment.Model;
            topic = ESocketTopic.BoardCard;
            break;
        case "ProjectCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.ORDER_CHANGED;
            targetModel = ProjectCheckitem.Model;
            topic = ESocketTopic.Board;
            break;
        case "ProjectWiki":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.WIKI.ORDER_CHANGED;
            targetModel = ProjectWiki.Model;
            topic = ESocketTopic.BoardWiki;
            break;
        case "ProjectLabel":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.LABEL.ORDER_CHANGED;
            targetModel = ProjectLabel.Model;
            topic = ESocketTopic.Board;
            break;
    }

    return useSocketHandler({
        topic,
        topicId: topicId,
        eventKey: `${new StringCase(type).toKebab()}-column-order-changed`,
        onProps: {
            name: onEventName,
            params,
            callback,
            responseConverter: (data) => {
                const model = targetModel.getModel(data.uid);
                if (model) {
                    model.order = data.order;
                }
                return data;
            },
        },
        sendProps: {
            name: sendEventName,
        },
    });
};

export default useColumnOrderChangedHandlers;
