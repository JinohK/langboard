import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectCardComment } from "@/core/models";

export interface ICardCommentReactedRawResponse {
    comment_uid: string;
    user_uid?: string;
    bot_uid?: string;
    reaction: TEmoji;
    is_reacted: bool;
}

export interface IUseCardCommentReactedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    cardUID: string;
}

const useCardCommentReactedHandlers = ({ callback, projectUID, cardUID }: IUseCardCommentReactedHandlersProps) => {
    return useSocketHandler<{}, ICardCommentReactedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-card-comment-reacted-${cardUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.CARD.COMMENT.REACTED,
            params: { uid: cardUID },
            callback,
            responseConverter: (data) => {
                const comment = ProjectCardComment.Model.getModel(data.comment_uid);
                if (!comment) {
                    return {};
                }

                const reaction = data.reaction;
                const reactions = comment.reactions || {};
                let targetReactions = reactions[reaction];
                if (data.is_reacted) {
                    if (!targetReactions) {
                        reactions[reaction] = [];
                        targetReactions = reactions[reaction];
                    }

                    if (data.user_uid) {
                        if (!targetReactions.includes(data.user_uid)) {
                            targetReactions.push(data.user_uid);
                        }
                    } else if (data.bot_uid) {
                        if (!targetReactions.includes(data.bot_uid)) {
                            targetReactions.push(data.bot_uid);
                        }
                    }
                } else {
                    if (targetReactions) {
                        const targetUID = data.user_uid || data.bot_uid;
                        targetReactions = targetReactions.filter((uid) => uid !== targetUID);
                        reactions[reaction] = targetReactions;
                    }
                }
                comment.reactions = reactions;
                return {};
            },
        },
    });
};

export default useCardCommentReactedHandlers;
