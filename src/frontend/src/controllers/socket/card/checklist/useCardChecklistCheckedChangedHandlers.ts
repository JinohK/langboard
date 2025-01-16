import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectChecklist } from "@/core/models";

export interface ICardChecklistCheckedChangedRawResponse {
    is_checked: bool;
}

export interface IUseCardChecklistCheckedChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checklist: ProjectChecklist.TModel;
}

const useCardChecklistCheckedChangedHandlers = ({ callback, cardUID, checklist }: IUseCardChecklistCheckedChangedHandlersProps) => {
    return useSocketHandler<{}, ICardChecklistCheckedChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checklist-checked-changed-${checklist.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKLIST.CHECKED_CHANGED,
            params: { uid: checklist.uid },
            callback,
            responseConverter: (data) => {
                checklist.is_checked = data.is_checked;
                return {};
            },
        },
    });
};

export default useCardChecklistCheckedChangedHandlers;
