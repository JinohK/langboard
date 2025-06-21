import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemCheckedChangedRawResponse {
    is_checked: bool;
}

export interface IUseCardCheckitemCheckedChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkitem: ProjectCheckitem.TModel;
}

const useCardCheckitemCheckedChangedHandlers = ({ callback, cardUID, checkitem }: IUseCardCheckitemCheckedChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemCheckedChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-checked-changed-${checkitem.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CHECKED_CHANGED,
            params: { uid: checkitem.uid },
            callback,
            responseConverter: (data) => {
                checkitem.is_checked = data.is_checked;
                return {};
            },
        },
    });
};

export default useCardCheckitemCheckedChangedHandlers;
