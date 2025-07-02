import { SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBoardChatCancelHandlersProps extends IBaseUseSocketHandlersProps<{ task_id: string }> {
    projectUID: string;
}

const useBoardChatCancelHandlers = ({ projectUID }: IUseBoardChatCancelHandlersProps) => {
    return useSocketHandler({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-chat-cancel-${projectUID}`,
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CHAT.CANCEL,
        },
    });
};

export default useBoardChatCancelHandlers;
