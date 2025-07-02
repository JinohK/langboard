import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardComment } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { ESocketTopic } from "@langboard/core/enums";

export interface ICardCommentUpdatedRawResponse {
    comment_uid: string;
    content: IEditorContent;
    commented_at: Date;
}

export interface IUseCardCommentUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentUpdatedHandlers = ({ callback, projectUID, cardUID }: IUseCardCommentUpdatedHandlersProps) => {
    return useSocketHandler<{}, ICardCommentUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-comment-updated-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.UPDATED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const comment = ProjectCardComment.Model.getModel(data.comment_uid);
                if (comment) {
                    comment.content = data.content;
                    comment.commented_at = data.commented_at;
                    comment.is_edited = true;
                }
                return {};
            },
        },
    });
};

export default useCardCommentUpdatedHandlers;
