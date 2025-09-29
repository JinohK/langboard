import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCard, ProjectCardComment } from "@/core/models";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.BOARD.CARD.COMMENT.ADDED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const card = ProjectCard.Model.getModel(cardUID);
                if (card) {
                    if (Utils.Type.isNumber(card.count_comment)) {
                        card.count_comment = card.count_comment + 1;
                    }
                }
                ProjectCardComment.Model.fromOne(data.comment, true);
                return {};
            },
        },
    });
};

export default useCardCommentAddedHandlers;
