import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem, User } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardCheckitemStatusChangedRawResponse {
    user?: User.Interface;
    status: ProjectCheckitem.ECheckitemStatus;
    accumulated_seconds: number;
    is_checked: bool;
    timer_started_at?: Date;
}

export interface IUseCardCheckitemStatusChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checkitem: ProjectCheckitem.TModel;
}

const useCardCheckitemStatusChangedHandlers = ({ callback, cardUID, checkitem }: IUseCardCheckitemStatusChangedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemStatusChangedRawResponse>({
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

export default useCardCheckitemStatusChangedHandlers;
