import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectLabel } from "@/core/models";

export interface ICardLabelsUpdatedRawResponse {
    labels: ProjectLabel.Interface[];
}

export interface IUseCardLabelsUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardLabelsUpdatedHandlers = ({ callback, projectUID, cardUID }: IUseCardLabelsUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardLabelsUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-labels-updated-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.LABELS_UPDATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    card.labels = data.labels;
                    card.label_uids = data.labels.map((label) => label.uid);
                }
                return {};
            },
        },
    });
};

export default useCardLabelsUpdatedHandlers;
