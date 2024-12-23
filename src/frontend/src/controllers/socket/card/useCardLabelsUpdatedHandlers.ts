import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface ICardLabelsUpdateRequest {}

export interface ICardLabelsUpdatedResponse {
    labels: ProjectLabel.Interface[];
}

export interface IUseCardLabelsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<ICardLabelsUpdatedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardLabelsUpdatedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardLabelsUpdatedHandlersProps) => {
    return useSocketHandler<ICardLabelsUpdateRequest, ICardLabelsUpdatedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-labels-updated-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.LABELS_UPDATED,
            params: { uid: cardUID },
            callback,
        },
    });
};

export default useCardLabelsUpdatedHandlers;
