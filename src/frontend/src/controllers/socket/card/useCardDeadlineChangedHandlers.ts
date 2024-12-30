import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";

export interface ICardDeadlineChangedRawResponse {
    deadline_at: string;
}

export interface IUseCardDeadlineChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardDeadlineChangedHandlers = ({ callback, projectUID, cardUID }: IUseCardDeadlineChangedHandlersProps) => {
    return useSocketHandler<{}, ICardDeadlineChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-deadline-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DEADLINE_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    card.deadline_at = data.deadline_at;
                }
                return {};
            },
        },
    });
};

export default useCardDeadlineChangedHandlers;
