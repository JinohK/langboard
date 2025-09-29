import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectLabel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.BOARD.CARD.LABELS_UPDATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    card.labels = data.labels;
                }
                return {};
            },
        },
    });
};

export default useCardLabelsUpdatedHandlers;
