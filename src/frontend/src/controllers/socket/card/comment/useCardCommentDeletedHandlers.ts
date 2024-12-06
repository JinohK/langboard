import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCommentDeletedRequest extends IModelIdBase {}

export interface ICardCommentDeletedResponse {
    comment_uid: string;
}

export interface IUseCardCommentDeletedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentDeletedResponse> {
    cardUID: string;
}

const useCardCommentDeletedHandlers = ({ socket, callback, cardUID }: IUseCardCommentDeletedHandlersProps) => {
    return useSocketHandler<ICardCommentDeletedRequest, ICardCommentDeletedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.DELETED,
            params: { uid: cardUID },
            callback,
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.COMMENT.DELETED,
        },
    });
};

export default useCardCommentDeletedHandlers;
