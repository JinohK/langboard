import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotModel } from "@/core/models";

export interface IIsBoardChatAvailableRequest {}

interface IBaseIsBoardChatAvailableResponse {
    available: bool;
    bot?: BotModel.Interface;
}

interface IBoardChatAvailableResponse extends IBaseIsBoardChatAvailableResponse {
    available: true;
    bot: BotModel.Interface;
}

interface IBoardChatUnavailableResponse extends IBaseIsBoardChatAvailableResponse {
    available: false;
    bot?: never;
}

export type TIsBoardChatAvailableResponse = IBoardChatAvailableResponse | IBoardChatUnavailableResponse;

export interface IUseIsBoardChatAvailableHandlersProps extends IBaseUseSocketHandlersProps<TIsBoardChatAvailableResponse> {
    projectUID: string;
}

const useIsBoardChatAvailableHandlers = ({ socket, callback, projectUID }: IUseIsBoardChatAvailableHandlersProps) => {
    return useSocketHandler<IIsBoardChatAvailableRequest, TIsBoardChatAvailableResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `is-board-chat-available-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.IS_CHAT_AVAILABLE,
            callback,
            responseConverter: (data) => {
                if (data.available) {
                    data.bot = BotModel.transformFromApi(data.bot);
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
