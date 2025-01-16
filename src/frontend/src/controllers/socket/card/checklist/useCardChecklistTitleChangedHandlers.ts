import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectChecklist } from "@/core/models";

export interface ICardChecklistTitleChangedRawResponse {
    title: string;
}

export interface IUseCardChecklistTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checklist: ProjectChecklist.TModel;
}

const useCardChecklistTitleChangedHandlers = ({ callback, cardUID, checklist }: IUseCardChecklistTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardChecklistTitleChangedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checklist-checked-changed-${checklist.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKLIST.TITLE_CHANGED,
            params: { uid: checklist.uid },
            callback,
            responseConverter: (data) => {
                checklist.title = data.title;
                return {};
            },
        },
    });
};

export default useCardChecklistTitleChangedHandlers;
