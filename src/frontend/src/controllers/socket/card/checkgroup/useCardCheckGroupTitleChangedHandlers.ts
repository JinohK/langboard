import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckGroup } from "@/core/models";

export interface ICardCheckGroupTitleChangedRawResponse {
    title: string;
}

export interface IUseCardCheckGroupTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkGroup: ProjectCheckGroup.TModel;
}

const useCardCheckGroupTitleChangedHandlers = ({ callback, cardUID, checkGroup }: IUseCardCheckGroupTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckGroupTitleChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-check-group-checked-changed-${checkGroup.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECK_GROUP.TITLE_CHANGED,
            params: { uid: checkGroup.uid },
            callback,
            responseConverter: (data) => {
                checkGroup.title = data.title;
                return {};
            },
        },
    });
};

export default useCardCheckGroupTitleChangedHandlers;
