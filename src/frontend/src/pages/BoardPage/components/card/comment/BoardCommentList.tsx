import { Box, Flex, Toast } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetCardComments from "@/controllers/api/card/comment/useGetCardComments";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import { useNavigate } from "react-router-dom";
import { ProjectCardComment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardComment, { SkeletonBoardComment } from "@/pages/BoardPage/components/card/comment/BoardComment";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

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
    const { data: commentsData, error, isFetching } = useGetCardComments({ project_uid: projectUID, card_uid: card.uid });
    const [t] = useTranslation();
    const navigateRef = useRef(useNavigate());

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found."));
                navigateRef.current(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return <>{!commentsData || isFetching ? <SkeletonBoardCommentList /> : <BoardCommentListResult viewportId={viewportId} />}</>;
}

interface IBoardCommentListResultProps extends IBoardCommentListProps {}

function BoardCommentListResult({ viewportId }: IBoardCommentListResultProps): JSX.Element {
    const { card } = useBoardCard();
    const [t] = useTranslation();
    const PAGE_SIZE = 10;
    const flatComments = ProjectCardComment.Model.useModels((model) => model.card_uid === card.uid);
    const sortedComments = useMemo(() => flatComments.sort((a, b) => b.commented_at.getTime() - a.commented_at.getTime()), [flatComments]);
    const { items: comments, nextPage, forceUpdate, hasMore } = useInfiniteScrollPager({ allItems: sortedComments, size: PAGE_SIZE });

    const deletedComment = (commentUID: string) => {
        const index = flatComments.findIndex((c) => c.uid === commentUID);
        if (index === -1) {
            return;
        }

        flatComments.splice(index, 1);
        forceUpdate();
    };

    return (
        <InfiniteScroller
            scrollable={() => document.getElementById(viewportId)}
            loadMore={nextPage}
            loader={<SkeletonBoardComment key={createShortUUID()} />}
            hasMore={hasMore}
            threshold={36}
            className="pb-2.5"
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
        </InfiniteScroller>
    );
}

export default BoardCommentList;
