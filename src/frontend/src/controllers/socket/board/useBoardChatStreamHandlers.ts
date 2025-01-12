import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketStreamHandler, { IBaseUseSocketStreamHandlersProps } from "@/core/helpers/SocketStreamHandler";
import { ChatMessageModel } from "@/core/models";

export interface IBoardChatStreamRawResponse {
    user_message: ChatMessageModel.Interface;
    ai_message: ChatMessageModel.Interface;
}

export interface IUseBoardChatStreamHandlersProps extends IBaseUseSocketStreamHandlersProps {
    projectUID: string;
}

const useBoardChatStreamHandlers = ({ projectUID, callbacks }: IUseBoardChatStreamHandlersProps) => {
    return useSocketStreamHandler({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-chat-stream-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT_STREAM,
            params: { uid: projectUID },
            callbacks,
        },
    });
};

export default useBoardChatStreamHandlers;
