import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { deleteCardModel } from "@/core/helpers/ModelHelper";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseCardDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardDeletedHandlers = ({ callback, projectUID, cardUID }: IUseCardDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `card-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.DELETED,
            params: { uid: cardUID },
            callback,
            responseConverter: () => {
                deleteCardModel(cardUID, true);
                return {};
            },
        },
    });
};

export default useCardDeletedHandlers;
