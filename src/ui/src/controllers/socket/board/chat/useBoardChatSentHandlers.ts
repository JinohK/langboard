import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatMessageModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardChatSentRawResponse {
    user_message: ChatMessageModel.Interface;
    ai_message: ChatMessageModel.Interface;
}

export interface IUseBoardChatSentHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardChatSentHandlers = ({ callback, projectUID }: IUseBoardChatSentHandlersProps) => {
    return useSocketHandler<{}, IBoardChatSentRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-chat-sent-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CHAT.SENT,
            callback,
            responseConverter: (data) => {
                ChatMessageModel.Model.fromOne(data.user_message, true);
                return {};
            },
        },
        sendProps: {
            name: SocketEvents.CLIENT.BOARD.CHAT.SEND,
        },
    });
};

export default useBoardChatSentHandlers;
