import { SocketEvents } from "@langboard/core/constants";
import useSocketStreamHandler, { IBaseUseSocketStreamHandlersProps } from "@/core/hooks/useSocketStreamHandler";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBoardChatStreamHandlersProps extends IBaseUseSocketStreamHandlersProps {
    projectUID: string;
}

const useBoardChatStreamHandlers = ({ projectUID, callbacks }: IUseBoardChatStreamHandlersProps) => {
    return useSocketStreamHandler({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-chat-stream-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CHAT.STREAM,
            params: { uid: projectUID },
            callbacks,
        },
    });
};

export default useBoardChatStreamHandlers;
