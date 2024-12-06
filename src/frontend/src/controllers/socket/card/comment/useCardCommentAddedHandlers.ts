import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { IModelIdBase } from "@/controllers/types";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardComment, User } from "@/core/models";

export interface ICardCommentAddedRequest extends IModelIdBase {}

export interface ICardCommentAddedResponse {
    comment: ProjectCardComment.IBoard;
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
