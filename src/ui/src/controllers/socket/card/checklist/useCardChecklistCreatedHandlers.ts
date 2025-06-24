import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectChecklist } from "@/core/models";

export interface ICardChecklistCreatedRawResponse {
    checklist: ProjectChecklist.Interface;
}

export interface IUseCardChecklistCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardChecklistCreatedHandlers = ({ callback, projectUID, cardUID }: IUseCardChecklistCreatedHandlersProps) => {
    return useSocketHandler<{}, ICardChecklistCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checklist-created-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKLIST.CREATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                ProjectChecklist.Model.fromOne(data.checklist, true);
                return {};
            },
        },
    });
};

export default useCardChecklistCreatedHandlers;
