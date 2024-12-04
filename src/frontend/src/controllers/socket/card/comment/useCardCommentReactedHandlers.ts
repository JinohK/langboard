import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCommentReactedRequest {
    user_id: number;
    card_uid: string;
    comment_uid: string;
    reaction: TEmoji;
    is_reacted: bool;
}

export interface ICardCommentReactedResponse {
    user_id: number;
    comment_uid: string;
    reaction: TEmoji;
    is_reacted: bool;
}

export interface IUseCardCommentReactedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentReactedResponse> {
    cardUID: string;
}

const useCardCommentReactedHandlers = ({ socket, callback, cardUID }: IUseCardCommentReactedHandlersProps) => {
    return useSocketHandler<ICardCommentReactedRequest, ICardCommentReactedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.REACTED,
            params: { uid: cardUID },
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.COMMENT.REACTED,
        },
    });
};

export default useCardCommentReactedHandlers;
