import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardComment, User } from "@/core/models";

export interface ICardCommentAddedRequest {}

export interface ICardCommentAddedResponse {
    comment: ProjectCardComment.IBoard;
}

export interface IUseCardCommentAddedHandlersProps extends IBaseUseSocketHandlersProps<ICardCommentAddedResponse> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentAddedHandlers = ({ socket, callback, projectUID, cardUID }: IUseCardCommentAddedHandlersProps) => {
    return useSocketHandler<ICardCommentAddedRequest, ICardCommentAddedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-card-comment-added-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.ADDED,
            params: { uid: cardUID },
            callback,
            responseConverter: (response) => {
                ProjectCardComment.transformFromApi(response.comment);
                User.transformFromApi(response.comment.user);
                return response;
            },
        },
    });
};

export default useCardCommentAddedHandlers;
