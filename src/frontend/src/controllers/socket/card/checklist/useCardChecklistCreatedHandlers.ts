import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectChecklist } from "@/core/models";

export interface ICardChecklistCreatedRawResponse {
    checklist: ProjectChecklist.Interface;
}

export interface IUseCardChecklistCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
}

const useCardChecklistCreatedHandlers = ({ callback, cardUID }: IUseCardChecklistCreatedHandlersProps) => {
    return useSocketHandler<{}, ICardChecklistCreatedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checklist-created-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKLIST.CREATED,
            callback,
            responseConverter: (data) => {
                ProjectChecklist.Model.fromObject(data.checklist, true);
                return {};
            },
        },
    });
};

export default useCardChecklistCreatedHandlers;
