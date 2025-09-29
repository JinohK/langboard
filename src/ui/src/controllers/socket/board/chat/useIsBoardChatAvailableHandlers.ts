import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { InternalBotModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

interface IBaseIsBoardChatAvailableRawResponse {
    available: bool;
    bot?: InternalBotModel.Interface;
}

interface IBoardChatAvailableRawResponse extends IBaseIsBoardChatAvailableRawResponse {
    available: true;
    bot: InternalBotModel.Interface;
}

interface IBoardChatUnavailableRawResponse extends IBaseIsBoardChatAvailableRawResponse {
    available: false;
    bot?: never;
}

export type TIsBoardChatAvailableRawResponse = IBoardChatAvailableRawResponse | IBoardChatUnavailableRawResponse;

interface IBaseIsBoardChatAvailableResponse {
    available: bool;
    bot?: InternalBotModel.TModel;
}

interface IBoardChatAvailableResponse extends IBaseIsBoardChatAvailableResponse {
    available: true;
    bot: InternalBotModel.TModel;
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
    return useSocketHandler<TIsBoardChatAvailableResponse, TIsBoardChatAvailableRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `is-board-chat-available-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CHAT.IS_AVAILABLE,
            callback,
            responseConverter: (data) => {
                let bot = undefined;
                if (data.available) {
                    bot = InternalBotModel.Model.fromOne(data.bot, true);
                }

                return {
                    available: data.available as false,
                    bot: bot as undefined,
                };
            },
        },
        sendProps: {
            name: SocketEvents.CLIENT.BOARD.CHAT.IS_AVAILABLE,
        },
    });
};

export default useIsBoardChatAvailableHandlers;
