import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCheckitem } from "@/core/models";
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
    type: "ProjectCard" | "ProjectCheckitem";
    params?: Record<string, string>;
    topicId: string;
}

const useRowOrderChangedHandlers = ({ callback, type, params, topicId }: IUseRowOrderChangedHandlersProps) => {
    let onEventName = "";
    const sendEventName = "";
    let targetModel;
    let targetModelColumn;
    let topic = ESocketTopic.None;
    switch (type) {
        case "ProjectCard":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED;
            targetModel = ProjectCard.Model;
            targetModelColumn = "column_uid";
            topic = ESocketTopic.Board;
            break;
        case "ProjectCheckitem":
            onEventName = SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.ORDER_CHANGED;
            targetModel = ProjectCheckitem.Model;
            targetModelColumn = "checklist_uid";
            topic = ESocketTopic.BoardCard;
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
                        model[targetModelColumn as "uid"] = data.column_uid;
                    }

                    if (data.move_type !== "in_column" && type === "ProjectCard") {
                        (model as ProjectCard.TModel).archived_at = (data as unknown as Record<string, Date>).archived_at;
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
