import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCheckitem } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";
import { isModel } from "@/core/models/ModelRegistry";

interface IBaseRowOrderChangedResponse {
    move_type: "to_column" | "in_column" | "from_column";
    column_uid?: string;
    uid: string;
    order: number;
}

interface IInColumnRowOrderChangedResponse extends IBaseRowOrderChangedResponse {
    move_type: "in_column";
    column_uid?: never;
}

interface IRemovedColumnRowOrderChangedResponse extends IBaseRowOrderChangedResponse {
    move_type: "from_column";
    column_uid: string;
}

interface IMovedColumnRowOrderChangedResponse extends IBaseRowOrderChangedResponse {
    move_type: "to_column";
    column_uid: string;
}

export type TRowOrderChangedResponse = IInColumnRowOrderChangedResponse | IRemovedColumnRowOrderChangedResponse | IMovedColumnRowOrderChangedResponse;

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
        eventKey: `${new Utils.String.Case(type).toKebab()}-row-order-changed`,
        onProps: {
            name: onEventName,
            params,
            callback,
            responseConverter: (data) => {
                if (data.move_type === "from_column") {
                    return data;
                }

                const model = targetModel.getModel(data.uid);
                if (model) {
                    model.order = data.order;
                    if (data.move_type === "to_column") {
                        model[targetModelColumn as "uid"] = data.column_uid;
                    }

                    if (data.move_type !== "in_column" && isModel(model, "ProjectCard")) {
                        model.archived_at = (data as unknown as Record<string, Date>).archived_at;
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
