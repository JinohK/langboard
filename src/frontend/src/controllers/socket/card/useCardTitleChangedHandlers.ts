import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";

export interface ICardTitleChangedRawResponse {
    title: string;
}

export interface IUseCardTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardTitleChangedHandlers = ({ callback, projectUID, cardUID }: IUseCardTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardTitleChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-title-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.TITLE_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    card.title = data.title;
                }
                return {};
            },
        },
    });
};

export default useCardTitleChangedHandlers;
