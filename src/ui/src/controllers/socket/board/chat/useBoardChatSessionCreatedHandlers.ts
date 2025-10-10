import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ChatSessionModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardChatSessionCreatedRawResponse {
    session: ChatSessionModel.Interface;
}

export interface IUseBoardChatSessionCreatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardChatSessionCreatedRawResponse> {
    projectUID: string;
}

const useBoardChatSessionCreatedHandlers = ({ callback, projectUID }: IUseBoardChatSessionCreatedHandlersProps) => {
    return useSocketHandler<IBoardChatSessionCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-chat-session-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.CHAT.SESSION,
            callback,
            responseConverter: (data) => {
                ChatSessionModel.Model.fromOne(data.session, true);
                return data;
            },
        },
    });
};

export default useBoardChatSessionCreatedHandlers;
