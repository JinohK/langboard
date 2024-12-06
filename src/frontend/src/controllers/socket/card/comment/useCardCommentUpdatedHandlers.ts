import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { IEditorContent } from "@/core/models/Base";

export interface ICardCommentUpdatedRequest extends IModelIdBase {}

export interface ICardCommentUpdatedResponse {
    comment_uid: string;
    content: IEditorContent;
    commented_at: Date;
}

export interface IUseCardCommentUpdatedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentUpdatedResponse> {
    cardUID: string;
}

const useCardCommentUpdatedHandlers = ({ socket, callback, cardUID }: IUseCardCommentUpdatedHandlersProps) => {
    return useSocketHandler<ICardCommentUpdatedRequest, ICardCommentUpdatedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.UPDATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (response) => ({
                ...response,
                commented_at: new Date(response.commented_at),
            }),
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.COMMENT.UPDATED,
        },
    });
};

export default useCardCommentUpdatedHandlers;
