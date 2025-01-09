import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { InternalBotModel } from "@/core/models";

interface IBaseIsBoardChatAvailableResponse {
    available: bool;
    bot?: InternalBotModel.Interface;
}

interface IBoardChatAvailableResponse extends IBaseIsBoardChatAvailableResponse {
    available: true;
    bot: InternalBotModel.Interface;
}

interface IBoardChatUnavailableResponse extends IBaseIsBoardChatAvailableResponse {
    available: false;
    bot?: never;
}

export type TIsBoardChatAvailableResponse = IBoardChatAvailableResponse | IBoardChatUnavailableResponse;

export interface IUseIsBoardChatAvailableHandlersProps extends IBaseUseSocketHandlersProps<TIsBoardChatAvailableResponse> {
    projectUID: string;
}

const useIsBoardChatAvailableHandlers = ({ callback, projectUID }: IUseIsBoardChatAvailableHandlersProps) => {
    return useSocketHandler({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `is-board-chat-available-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE,
            callback,
            responseConverter: (data) => {
                if (data.available) {
                    data.bot = InternalBotModel.transformFromApi(data.bot);
                }
                return data;
            },
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.IS_CHAT_AVAILABLE,
        },
    });
};

export default useIsBoardChatAvailableHandlers;
