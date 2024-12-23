import { Box, Flex, Toast } from "@/components/base";
import useGetCardComments from "@/controllers/api/card/comment/useGetCardComments";
import useCardCommentAddedHandlers from "@/controllers/socket/card/comment/useCardCommentAddedHandlers";
import useCardCommentDeletedHandlers from "@/controllers/socket/card/comment/useCardCommentDeletedHandlers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import useSwitchSocketHandlers from "@/core/hooks/useSwitchSocketHandlers";
import { ProjectCardComment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardComment, { SkeletonBoardComment } from "@/pages/BoardPage/components/card/comment/BoardComment";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import InfiniteScroll from "react-infinite-scroller";

export interface IBoardCommentListProps {
    viewportId: string;
}

export function SkeletonBoardCommentList() {
    return (
        <Box pb="2.5">
            <Flex direction="col" gap="4">
                <SkeletonBoardComment />
                <SkeletonBoardComment />
                <SkeletonBoardComment />
                <SkeletonBoardComment />
                <SkeletonBoardComment />
            </Flex>
        </Box>
    );
}

function BoardCommentList({ viewportId }: IBoardCommentListProps): JSX.Element {
    const { projectUID, card } = useBoardCard();
    const { data: commentsData, error } = useGetCardComments({ project_uid: projectUID, card_uid: card.uid });
    const [t] = useTranslation();
    const navigate = useRef(usePageNavigate());

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate.current(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return <>{!commentsData ? <SkeletonBoardCommentList /> : <BoardCommentListResult viewportId={viewportId} comments={commentsData.comments} />}</>;
}

interface IBoardCommentListResultProps extends IBoardCommentListProps {
    comments: ProjectCardComment.IBoard[];
}

function BoardCommentListResult({ comments: flatComments, viewportId }: IBoardCommentListResultProps): JSX.Element {
    const { projectUID, card, socket } = useBoardCard();
    const [t] = useTranslation();
    const PAGE_SIZE = 10;
    const { items: comments, nextPage, forceUpdate, hasMore } = useInfiniteScrollPager({ allItems: flatComments, size: PAGE_SIZE });
    const commentAddedHandler = useCardCommentAddedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            flatComments.unshift(data.comment);
            forceUpdate();
        },
    });
    const commentDeletedHandler = useCardCommentDeletedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            deletedComment(data.comment_uid);
        },
    });
    useSwitchSocketHandlers({ socket, handlers: [commentAddedHandler, commentDeletedHandler] });

    const deletedComment = (commentUID: string) => {
        const index = flatComments.findIndex((c) => c.uid === commentUID);
        if (index === -1) {
            return;
        }

        flatComments.splice(index, 1);
        forceUpdate();
    };

    return (
        <InfiniteScroll
            getScrollParent={() => document.getElementById(viewportId)}
            loadMore={nextPage}
            loader={<SkeletonBoardComment key={createShortUUID()} />}
            hasMore={hasMore}
            threshold={0}
            initialLoad={false}
            className="pb-2.5"
            useWindow={false}
            pageStart={1}
        >
            {comments.length === 0 && (
                <Box textSize="sm" className="text-accent-foreground/50">
                    {t("card.No comments")}
                </Box>
            )}
            <Flex direction="col" gap="4">
                {comments.map((comment) => {
                    return <BoardComment key={`${card.uid}-${comment.uid}`} comment={comment} deletedComment={deletedComment} />;
                })}
            </Flex>
        </InfiniteScroll>
    );
}

export default BoardCommentList;
