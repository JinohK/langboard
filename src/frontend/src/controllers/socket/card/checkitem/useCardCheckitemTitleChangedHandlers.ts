import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemTitleChangedRawResponse {
    title: string;
}

export interface IUseCardCheckitemTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkitem: ProjectCheckitem.TModel;
}

const useCardCheckitemTitleChangedHandlers = ({ callback, cardUID, checkitem }: IUseCardCheckitemTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemTitleChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-title-changed-${checkitem.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CHECKED_CHANGED,
            params: { uid: checkitem.uid },
            callback,
            responseConverter: (data) => {
                checkitem.title = data.title;
                return {};
            },
        },
    });
};

export default useCardCheckitemTitleChangedHandlers;
