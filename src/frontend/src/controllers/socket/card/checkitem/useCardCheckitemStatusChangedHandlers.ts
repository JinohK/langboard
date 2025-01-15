import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, User } from "@/core/models";
import { ECheckitemStatus } from "@/core/models/ProjectCheckitem";

export interface ICardCheckitemTitleChangedRawResponse {
    user?: User.Interface;
    status: ECheckitemStatus;
    accumulated_seconds: number;
    is_checked: bool;
    timer_started_at?: Date;
}

export interface IUseCardCheckitemTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkitem: ProjectCheckitem.TModel;
}

const useCardCheckitemTitleChangedHandlers = ({ callback, cardUID, checkitem }: IUseCardCheckitemTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemTitleChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-status-changed-${checkitem.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.STATUS_CHANGED,
            params: { uid: checkitem.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    checkitem[key] = value as never;
                });
                return {};
            },
        },
    });
};

export default useCardCheckitemTitleChangedHandlers;
