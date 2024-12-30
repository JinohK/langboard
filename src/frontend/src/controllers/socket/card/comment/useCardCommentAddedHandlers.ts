import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCardComment } from "@/core/models";
import TypeUtils from "@/core/utils/TypeUtils";

export interface ICardCommentAddedRawResponse {
    comment: ProjectCardComment.IStore;
}

export interface IUseCardCommentAddedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentAddedHandlers = ({ callback, projectUID, cardUID }: IUseCardCommentAddedHandlersProps) => {
    return useSocketHandler<{}, ICardCommentAddedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-comment-added-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.ADDED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    if (TypeUtils.isNumber(card.count_comment)) {
                        card.count_comment = card.count_comment + 1;
                    }
                }
                ProjectCardComment.Model.fromObject(data.comment, true);
                return {};
            },
        },
    });
};

export default useCardCommentAddedHandlers;
