import { IBoardCardComment } from "@/controllers/api/card/comment/useGetCardComments";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardComment, User } from "@/core/models";

export interface ICardCommentAddedRequest {
    card_uid: string;
    comment: IBoardCardComment;
}

export interface ICardCommentAddedResponse {
    comment: IBoardCardComment;
}

export interface IUseCardCommentAddedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentAddedResponse> {
    cardUID?: string;
}

const useCardCommentAddedHandlers = ({ socket, callback, cardUID }: IUseCardCommentAddedHandlersProps) => {
    return useSocketHandler<ICardCommentAddedRequest, ICardCommentAddedResponse>({
        socket,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.ADDED,
            params: cardUID ? { uid: cardUID } : undefined,
            callback,
            responseConverter: (response) => {
                ProjectCardComment.transformFromApi(response.comment);
                User.transformFromApi(response.comment.user);
                return response;
            },
        },
        sendProps: {
            name: SOCKET_CLIENT_EVENTS.BOARD.CARD.COMMENT.ADDED,
        },
    });
};

export default useCardCommentAddedHandlers;
