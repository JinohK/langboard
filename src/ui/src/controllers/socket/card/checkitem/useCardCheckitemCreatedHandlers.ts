import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemCreatedRawResponse {
    checkitem: ProjectCheckitem.Interface;
}

export interface IUseCardCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
    checklistUID: string;
}

const useCardCheckitemCreatedHandlers = ({ callback, cardUID, checklistUID }: IUseCardCheckitemCreatedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemCreatedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-checkitem-created-${checklistUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CREATED,
            params: { uid: checklistUID },
            callback,
            responseConverter: (data) => {
                ProjectCheckitem.Model.fromObject(data.checkitem, true);
                return {};
            },
        },
    });
};

export default useCardCheckitemCreatedHandlers;
