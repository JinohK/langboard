import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler from "@/core/helpers/SocketHandler";

export interface IUseBoardChatCancelHandlersProps {
    projectUID: string;
}

const useBoardChatCancelHandlers = ({ projectUID }: IUseBoardChatCancelHandlersProps) => {
    return useSocketHandler({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-sent-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT_CANCELLED,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CHAT_CANCEL,
        },
    });
};

export default useBoardChatCancelHandlers;
