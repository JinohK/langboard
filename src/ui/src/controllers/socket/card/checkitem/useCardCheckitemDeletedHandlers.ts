import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardCheckitemDeletedRawResponse {
    uid: string;
}

export interface IUseCardCheckitemDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checklistUID: string;
}

const useCardCheckitemDeletedHandlers = ({ callback, cardUID, checklistUID }: IUseCardCheckitemDeletedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemDeletedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-deleted-${checklistUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.DELETED,
            params: { uid: checklistUID },
            callback,
            responseConverter: (data) => {
                ProjectCheckitem.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useCardCheckitemDeletedHandlers;
