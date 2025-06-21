import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketStreamHandler, { IBaseUseSocketStreamHandlersProps } from "@/core/hooks/useSocketStreamHandler";

export interface IUseBoardChatStreamHandlersProps extends IBaseUseSocketStreamHandlersProps {
    projectUID: string;
}

const useBoardChatStreamHandlers = ({ projectUID, callbacks }: IUseBoardChatStreamHandlersProps) => {
    return useSocketStreamHandler({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-chat-stream-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT.STREAM,
            params: { uid: projectUID },
            callbacks,
        },
    });
};

export default useBoardChatStreamHandlers;
