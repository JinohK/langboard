import { Flex, Toast } from "@/components/base";
import useGetCardComments, { IBoardCardComment } from "@/controllers/board/useGetCardComments";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { ROUTES } from "@/core/routing/constants";
import { createShortUUID } from "@/core/utils/StringUtils";
import BoardComment, { SkeletonBoardComment } from "@/pages/BoardPage/components/card/BoardComment";
import { IBaseCardRelatedComponentProps } from "@/pages/BoardPage/components/card/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import InfiniteScroll from "react-infinite-scroller";
import { useNavigate } from "react-router-dom";

export interface IBoardCommentListProps extends IBaseCardRelatedComponentProps {
    viewportId: string;
}

function BoardCommentList({ projectUID, card, currentUser, currentUserRoleActions, socket, viewportId }: IBoardCommentListProps): JSX.Element {
    const { data: commentsData, error } = useGetCardComments({ project_uid: projectUID, card_uid: card.uid });
    const [t] = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!error) {
            return;
        }

        const { handle } = setupApiErrorHandler({
            [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                Toast.Add.error(t("errors.Forbidden"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_403_FORBIDDEN), { replace: true });
            },
            [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                Toast.Add.error(t("dashboard.errors.Project not found"));
                navigate(ROUTES.ERROR(EHttpStatus.HTTP_404_NOT_FOUND), { replace: true });
            },
        });

        handle(error);
    }, [error]);

    return (
        <>
            {!commentsData ? (
                "loading..."
            ) : (
                <BoardCommentListResult
                    projectUID={projectUID}
                    card={card}
                    currentUser={currentUser}
                    currentUserRoleActions={currentUserRoleActions}
                    socket={socket}
                    viewportId={viewportId}
                    comments={commentsData.comments}
                />
            )}
        </>
    );
}

interface IBoardCommentListResultProps extends IBaseCardRelatedComponentProps {
    viewportId: string;
    comments: IBoardCardComment[];
}

function BoardCommentListResult({
    projectUID,
    card,
    currentUser,
    currentUserRoleActions,
    socket,
    comments: flatComments,
    viewportId,
}: IBoardCommentListResultProps): JSX.Element {
    const [t] = useTranslation();
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;
    const comments = useMemo<IBoardCardComment[]>(() => {
        return flatComments.slice(0, page * PAGE_SIZE);
    }, [flatComments, page]);
    const lastPageRef = useRef(Math.ceil(flatComments.length / PAGE_SIZE));

    const nextPage = (next: number) => {
        if (next - page > 1) {
            return;
        }

        new Promise((resolve) => {
            setPage(next);
            resolve(undefined);
        });
    };

    return (
        <InfiniteScroll
            getScrollParent={() => document.getElementById(viewportId)}
            loadMore={nextPage}
            loader={<SkeletonBoardComment key={createShortUUID()} />}
            hasMore={page < lastPageRef.current && flatComments.length > PAGE_SIZE}
            threshold={40}
            initialLoad={false}
            className="pb-2.5"
            useWindow={false}
            pageStart={1}
        >
            {comments.length === 0 && <div className="text-sm text-accent-foreground/50">{t("card.No comments")}</div>}
            <Flex direction="col" gap="4">
                {comments.map((comment) => {
                    return (
                        <BoardComment
                            key={`${card.uid}-${comment.uid}`}
                            projectUID={projectUID}
                            card={card}
                            currentUser={currentUser}
                            currentUserRoleActions={currentUserRoleActions}
                            socket={socket}
                            comment={comment}
                        />
                    );
                })}
            </Flex>
        </InfiniteScroll>
    );
}

export default BoardCommentList;
