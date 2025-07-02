import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardCheckitemCardifiedRawResponse {
    card: ProjectCard.Interface;
}

export interface IUseCardCheckitemCardifiedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkitem: ProjectCheckitem.TModel;
}

const useCardCheckitemCardifiedHandlers = ({ callback, cardUID, checkitem }: IUseCardCheckitemCardifiedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemCardifiedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-cardified-${checkitem.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CARDIFIED,
            params: { uid: checkitem.uid },
            callback,
            responseConverter: (data) => {
                checkitem.cardified_card = data.card;
                return {};
            },
        },
    });
};

export default useCardCheckitemCardifiedHandlers;
