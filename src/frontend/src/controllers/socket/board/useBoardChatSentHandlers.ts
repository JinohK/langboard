import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatMessageModel } from "@/core/models";

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
        eventKey: `board-card-sent-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CHAT.SENT,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                data.user_message.projectUID = projectUID;
                ChatMessageModel.Model.fromObject(data.user_message, true);
                return {};
            },
        },
    });
};

export default useBoardChatSentHandlers;
