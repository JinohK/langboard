import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckGroup } from "@/core/models";

export interface ICardCheckGroupCheckedChangedRawResponse {
    is_checked: bool;
}

export interface IUseCardCheckGroupCheckedChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkGroup: ProjectCheckGroup.TModel;
}

const useCardCheckGroupCheckedChangedHandlers = ({ callback, cardUID, checkGroup }: IUseCardCheckGroupCheckedChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckGroupCheckedChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-check-group-checked-changed-${checkGroup.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECK_GROUP.CHECKED_CHANGED,
            params: { uid: checkGroup.uid },
            callback,
            responseConverter: (data) => {
                checkGroup.is_checked = data.is_checked;
                return {};
            },
        },
    });
};

export default useCardCheckGroupCheckedChangedHandlers;
