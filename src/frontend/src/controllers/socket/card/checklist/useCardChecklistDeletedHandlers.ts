import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectChecklist, ProjectCheckitem } from "@/core/models";

export interface ICardChecklistDeletedRawResponse {
    uid: string;
}

export interface IUseCardChecklistDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardChecklistDeletedHandlers = ({ callback, projectUID, cardUID }: IUseCardChecklistDeletedHandlersProps) => {
    return useSocketHandler<{}, ICardChecklistDeletedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checklist-created-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKLIST.DELETED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                ProjectChecklist.Model.deleteModel(data.uid);
                ProjectCheckitem.Model.deleteModels((model) => model.checklist_uid === data.uid);
                return {};
            },
        },
    });
};

export default useCardChecklistDeletedHandlers;
