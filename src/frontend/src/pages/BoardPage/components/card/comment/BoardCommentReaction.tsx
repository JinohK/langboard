import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import ReactionCounter from "@/components/ReactionCounter";
import { IBoardCardComment } from "@/controllers/api/card/comment/useGetCardComments";
import useReactCardComment from "@/controllers/api/card/comment/useReactCardComment";
import useCardCommentReactedHandlers from "@/controllers/socket/card/comment/useCardCommentReactedHandlers";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { useEffect, useState } from "react";

export interface IBoardCommentReactionProps {
    comment: IBoardCardComment;
}

const BoardCommentReaction = ({ comment }: IBoardCommentReactionProps): JSX.Element => {
    const { projectUID, card, socket, currentUser } = useBoardCard();
    const [reactions, setReactions] = useState(comment.reactions);
    const { mutate: reactCardCommentMutate } = useReactCardComment();
    const [isValidating, setIsValidating] = useState(false);
    const { on: onCardCommentReacted, send: sendCardCommentReacted } = useCardCommentReactedHandlers({
        socket,
        cardUID: card.uid,
        callback: (data) => {
            if (comment.uid !== data.comment_uid) {
                return;
            }

            toggleReaction(data.user_id, data.reaction, data.is_reacted);
        },
    });

    useEffect(() => {
        const { off } = onCardCommentReacted();

        return () => {
            off();
        };
    }, []);

    const submitToggleReaction = (reaction: TEmoji) => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        reactCardCommentMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                comment_uid: comment.uid,
                reaction,
            },
            {
                onSuccess: (data) => {
                    toggleReaction(currentUser.id, reaction, data.is_reacted);

                    sendCardCommentReacted({
                        user_id: currentUser.id,
                        card_uid: card.uid,
                        comment_uid: comment.uid,
                        reaction,
                        is_reacted: data.is_reacted,
                    });
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    const toggleReaction = (userId: number, reaction: TEmoji, isReacted: bool) => {
        if (isReacted) {
            setReactions((prev) => {
                const newReactions = { ...prev };
                newReactions[reaction] = newReactions[reaction] ? [...newReactions[reaction].filter((uid) => uid !== userId), userId] : [userId];
                return newReactions;
            });
        } else {
            setReactions((prev) => {
                const newReactions = { ...prev };
                newReactions[reaction] = newReactions[reaction]?.filter((uid) => uid !== userId);
                return newReactions;
            });
        }
    };

    return (
        <ReactionCounter
            reactions={reactions}
            isActiveReaction={(_, data) => {
                return data.includes(currentUser.id);
            }}
            toggleCallback={submitToggleReaction}
            disabled={isValidating}
        />
    );
};

export default BoardCommentReaction;
