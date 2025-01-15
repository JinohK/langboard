import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckGroup, ProjectCheckitem } from "@/core/models";

export interface ICardCheckGroupDeletedRawResponse {
    uid: string;
}

export interface IUseCardCheckGroupDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
}

const useCardCheckGroupDeletedHandlers = ({ callback, cardUID }: IUseCardCheckGroupDeletedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckGroupDeletedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-check-group-created-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECK_GROUP.DELETED,
            callback,
            responseConverter: (data) => {
                ProjectCheckGroup.Model.deleteModel(data.uid);
                ProjectCheckitem.Model.deleteModels((model) => model.check_group_uid === data.uid);
                return {};
            },
        },
    });
};

export default useCardCheckGroupDeletedHandlers;
