import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCommentReactedRequest {}

export interface ICardCommentReactedResponse {
    user_id: number;
    comment_uid: string;
    reaction: TEmoji;
    is_reacted: bool;
}

export interface IUseCardCommentReactedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentReactedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentReactedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardCommentReactedHandlersProps) => {
    return useSocketHandler<ICardCommentReactedRequest, ICardCommentReactedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-comment-reacted-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.REACTED,
            params: { uid: cardUID },
            callback,
        },
    });
};

export default useCardCommentReactedHandlers;
