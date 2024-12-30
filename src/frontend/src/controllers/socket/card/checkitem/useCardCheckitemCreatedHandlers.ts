import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemCreatedRawResponse {
    checkitem: ProjectCheckitem.IStore;
}

export interface IUseCardCheckitemCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardCheckitemCreatedHandlers = ({ callback, projectUID, cardUID }: IUseCardCheckitemCreatedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-created-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.CREATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                data.checkitem.project_uid = projectUID;
                ProjectCheckitem.Model.fromObject(data.checkitem, true);
                return {};
            },
        },
    });
};

export default useCardCheckitemCreatedHandlers;
