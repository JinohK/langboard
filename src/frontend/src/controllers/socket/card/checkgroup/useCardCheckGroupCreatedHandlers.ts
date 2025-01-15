import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCheckGroup } from "@/core/models";

export interface ICardCheckGroupCreatedRawResponse {
    check_group: ProjectCheckGroup.Interface;
}

export interface IUseCardCheckGroupCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    cardUID: string;
}

const useCardCheckGroupCreatedHandlers = ({ callback, cardUID }: IUseCardCheckGroupCreatedHandlersProps) => {
    return useSocketHandler<{}, ICardCheckGroupCreatedRawResponse>({
        topic: ESocketTopic.BoardCard,
        topicId: cardUID,
        eventKey: `board-card-check-group-created-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.CHECK_GROUP.CREATED,
            callback,
            responseConverter: (data) => {
                ProjectCheckGroup.Model.fromObject(data.check_group, true);
                return {};
            },
        },
    });
};

export default useCardCheckGroupCreatedHandlers;
