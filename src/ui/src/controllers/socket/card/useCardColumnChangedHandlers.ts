import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardColumnChangedRawResponse {
    to_column_uid: string;
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
            name: SocketEvents.SERVER.BOARD.CARD.ORDER_CHANGED,
            params: { uid: card.uid },
            callback,
            responseConverter: (data) => {
                card.column_uid = data.to_column_uid;
                card.column_name = data.column_name;
                return {};
            },
        },
    });
};

export default useCardColumnChangedHandlers;
