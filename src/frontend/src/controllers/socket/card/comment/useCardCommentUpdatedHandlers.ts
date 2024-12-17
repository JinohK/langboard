import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { IEditorContent } from "@/core/models/Base";

export interface ICardCommentUpdatedRequest {}

export interface ICardCommentUpdatedResponse {
    comment_uid: string;
    content: IEditorContent;
    commented_at: Date;
}

export interface IUseCardCommentUpdatedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentUpdatedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentUpdatedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardCommentUpdatedHandlersProps) => {
    return useSocketHandler<ICardCommentUpdatedRequest, ICardCommentUpdatedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-comment-updated-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.UPDATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (response) => ({
                ...response,
                commented_at: new Date(response.commented_at),
            }),
        },
    });
};

export default useCardCommentUpdatedHandlers;
