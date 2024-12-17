import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface ICardCommentDeletedRequest {}

export interface ICardCommentDeletedResponse {
    comment_uid: string;
}

export interface IUseCardCommentDeletedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentDeletedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentDeletedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardCommentDeletedHandlersProps) => {
    return useSocketHandler<ICardCommentDeletedRequest, ICardCommentDeletedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-comment-deleted-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.DELETED,
            params: { uid: cardUID },
            callback,
        },
    });
};

export default useCardCommentDeletedHandlers;
