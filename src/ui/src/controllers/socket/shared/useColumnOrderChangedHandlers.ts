import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardAttachment, ProjectChecklist, ProjectColumn, ProjectLabel, ProjectWiki } from "@/core/models";
import { TPickedModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

export interface IColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IColumnOrderChangedResponse> {
    type: "ProjectColumn" | "ProjectCardAttachment" | "ProjectChecklist" | "ProjectWiki" | "ProjectLabel";
    params?: Record<string, string>;
    topicId: string;
    sortedModels: TPickedModel<IUseColumnOrderChangedHandlersProps["type"]>[];
}

const useColumnOrderChangedHandlers = ({ callback, type, params, topicId, sortedModels }: IUseColumnOrderChangedHandlersProps) => {
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
        case "ProjectChecklist":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKLIST.ORDER_CHANGED;
            targetModel = ProjectChecklist.Model;
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
        topicId,
        eventKey: `${new Utils.String.Case(type).toKebab()}-column-order-changed`,
        onProps: {
            name: onEventName,
            params,
            callback,
            responseConverter: (data) => {
                const model = targetModel.getModel(data.uid);
                if (model && model.order !== data.order) {
                    const reordered = reorder({ list: sortedModels, startIndex: model.order, finishIndex: data.order });
                    reordered.forEach((item, index) => {
                        item.order = index;
                    });
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
