import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardChatAvailableRequest {}

export interface IBoardChatAvailableResponse {
    available: bool;
}

export interface IUseBoardChatAvailableHandlersProps extends IBaseUseSocketHandlersProps<IBoardChatAvailableResponse> {
    projectUID: string;
}

const useBoardChatAvailableHandlers = ({ socket, callback, projectUID }: IUseBoardChatAvailableHandlersProps) => {
    return useSocketHandler<IBoardChatAvailableRequest, IBoardChatAvailableResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `is-board-chat-available-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE,
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.IS_CHAT_AVAILABLE,
        },
    });
};

export default useBoardChatAvailableHandlers;
