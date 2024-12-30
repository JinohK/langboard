import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckitem } from "@/core/models";

export interface ICardCheckitemDeletedRawResponse {
    uid: string;
}

export interface IUseCardCheckitemDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    uid: string;
}

const useCardCheckitemDeletedHandlers = ({ callback, projectUID, uid }: IUseCardCheckitemDeletedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckitemDeletedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-checkitem-deleted-${uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECKITEM.DELETED,
            params: { uid },
            callback,
            responseConverter: (data) => {
                ProjectCheckitem.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useCardCheckitemDeletedHandlers;
