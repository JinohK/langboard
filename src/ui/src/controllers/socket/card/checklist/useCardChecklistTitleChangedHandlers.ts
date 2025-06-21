import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectChecklist } from "@/core/models";

export interface ICardChecklistTitleChangedRawResponse {
    uid: string;
    title: string;
}

export interface IUseCardChecklistTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardChecklistTitleChangedHandlers = ({ callback, projectUID, cardUID }: IUseCardChecklistTitleChangedHandlersProps) => {
    return useSocketHandler<{}, ICardChecklistTitleChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checklist-checked-changed-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKLIST.TITLE_CHANGED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const model = ProjectChecklist.Model.getModel(data.uid);
                if (model) {
                    model.title = data.title;
                }
                return {};
            },
        },
    });
};

export default useCardChecklistTitleChangedHandlers;
