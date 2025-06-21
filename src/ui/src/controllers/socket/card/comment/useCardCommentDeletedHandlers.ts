import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCardComment } from "@/core/models";
import TypeUtils from "@/core/utils/TypeUtils";

export interface ICardCommentDeletedRawResponse {
    comment_uid: string;
}

export interface IUseCardCommentDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentDeletedHandlers = ({ callback, projectUID, cardUID }: IUseCardCommentDeletedHandlersProps) => {
    return useSocketHandler<{}, ICardCommentDeletedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-comment-deleted-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.DELETED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    if (TypeUtils.isNumber(card.count_comment)) {
                        card.count_comment = card.count_comment - 1;
                    }
                }
                ProjectCardComment.Model.deleteModel(data.comment_uid);
                return {};
            },
        },
    });
};

export default useCardCommentDeletedHandlers;
