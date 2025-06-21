import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";

export interface ICardColumnChangedRawResponse {
    column_uid: string;
    column_name: string;
}

export interface IUseCardColumnChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    card: ProjectCard.TModel;
}

const useCardColumnChangedHandlers = ({ callback, card }: IUseCardColumnChangedHandlersProps) => {
    return useSocketHandler<{}, ICardColumnChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: card.uid,
        eventKey: `board-card-column-changed-${card.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.ORDER_CHANGED,
            params: { uid: card.uid },
            callback,
            responseConverter: (data) => {
                card.column_uid = data.column_uid;
                card.column_name = data.column_name;
                return {};
            },
        },
    });
};

export default useCardColumnChangedHandlers;
