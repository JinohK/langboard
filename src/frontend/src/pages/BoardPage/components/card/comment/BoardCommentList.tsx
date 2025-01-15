import { Box, Flex, Toast } from "@/components/base";
import InfiniteScroller from "@/components/InfiniteScroller";
import useGetCardComments from "@/controllers/api/card/comment/useGetCardComments";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useInfiniteScrollPager from "@/core/hooks/useInfiniteScrollPager";
import usePageNavigate from "@/core/hooks/usePageNavigate";
import { ProjectCardComment } from "@/core/models";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardComment, { SkeletonBoardComment } from "@/pages/BoardPage/components/card/comment/BoardComment";
import { useEffect, useRef } from "react";
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
    comments: ProjectCardComment.TModel[];
}

function BoardCommentListResult({ comments: flatComments, viewportId }: IBoardCommentListResultProps): JSX.Element {
    const { card } = useBoardCard();
    const [t] = useTranslation();
    const PAGE_SIZE = 10;
    const { items: comments, nextPage, forceUpdate, hasMore } = useInfiniteScrollPager({ allItems: flatComments, size: PAGE_SIZE });
    ProjectCardComment.Model.subscribe(
        "CREATION",
        `board-card-comment-list-${card.uid}`,
        (models) => {
            flatComments.push(...models);
            forceUpdate();
        },
        (model) => model.card_uid === card.uid
    );
    ProjectCardComment.Model.subscribe("DELETION", `board-card-comment-list-${card.uid}`, (uids) => {
        uids.forEach((uid) => {
            const index = flatComments.findIndex((c) => c.uid === uid);
            if (index === -1) {
                return;
            }

            flatComments.splice(index, 1);
        });
        forceUpdate();
    });

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
