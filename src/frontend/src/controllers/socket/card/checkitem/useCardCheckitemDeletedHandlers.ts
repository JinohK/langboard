import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemDeletedRawResponse {
    uid: string;
}

export interface IUseCardCheckitemDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkGroupUID: string;
}

const useCardCheckitemDeletedHandlers = ({ callback, cardUID, checkGroupUID }: IUseCardCheckitemDeletedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemDeletedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-deleted-${checkGroupUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.DELETED,
            params: { uid: checkGroupUID },
            callback,
            responseConverter: (data) => {
                ProjectCheckitem.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useCardCheckitemDeletedHandlers;
