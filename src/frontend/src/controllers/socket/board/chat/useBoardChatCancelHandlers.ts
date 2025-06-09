import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IUseBoardChatCancelHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardChatCancelHandlers = ({ projectUID, callback }: IUseBoardChatCancelHandlersProps) => {
    return useSocketHandler({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-cancel-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT.CANCELLED,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CHAT.CANCEL,
        },
    });
};

export default useBoardChatCancelHandlers;
