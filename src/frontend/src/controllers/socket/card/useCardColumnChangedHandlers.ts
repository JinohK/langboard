import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";

export interface ICardColumnChangedRawResponse {
    column_uid: string;
    column_name: string;
}

export interface IUseCardColumnChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardColumnChangedHandlers = ({ callback, projectUID, cardUID }: IUseCardColumnChangedHandlersProps) => {
    return useSocketHandler<{}, ICardColumnChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-column-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    card.column_uid = data.column_uid;
                    card.column_name = data.column_name;
                }
                return {};
            },
        },
    });
};

export default useCardColumnChangedHandlers;
