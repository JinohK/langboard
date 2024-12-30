import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";
import { StringCase } from "@/core/utils/StringUtils";

interface IBaseRowOrderChangedResponse {
    move_type: "from_column" | "to_column" | "in_column";
    column_uid?: string;
    uid: string;
    order: number;
}

interface IInColumnRowOrderChangedResponse extends IBaseRowOrderChangedResponse {
    move_type: "in_column";
    column_uid?: never;
}

interface IMovedColumnRowOrderChangedResponse extends IBaseRowOrderChangedResponse {
    move_type: "from_column" | "to_column";
    column_uid: string;
}

export type TRowOrderChangedResponse = IInColumnRowOrderChangedResponse | IMovedColumnRowOrderChangedResponse;

export interface IUseRowOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<TRowOrderChangedResponse> {
    type: "ProjectCard" | "ProjectCardSubCheckitem";
    params?: Record<string, string>;
    topicId: string;
}

const useRowOrderChangedHandlers = ({ callback, type, params, topicId }: IUseRowOrderChangedHandlersProps) => {
    let onEventName = "";
    const sendEventName = "";
    let targetModel;
    let topic = ESocketTopic.None;
    switch (type) {
        case "ProjectCard":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED;
            targetModel = ProjectCard.Model;
            topic = ESocketTopic.Board;
            break;
        case "ProjectCardSubCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.SUB_CHECKITEM.ORDER_CHANGED;
            targetModel = ProjectCard.Model;
            topic = ESocketTopic.Board;
            break;
    }

    return useSocketHandler({
        topic,
        topicId: topicId,
        eventKey: `${new StringCase(type).toKebab()}-row-order-changed`,
        onProps: {
            name: onEventName,
            params,
            callback,
            responseConverter: (data) => {
                const model = targetModel.getModel(data.uid);
                if (model) {
                    model.order = data.order;
                    if (data.move_type === "to_column") {
                        model.column_uid = data.column_uid;
                    }
                }
                return data;
            },
        },
        sendProps: {
            name: sendEventName,
        },
    });
};

export default useRowOrderChangedHandlers;
