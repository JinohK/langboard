import { Button, Flex, Separator, Skeleton, Toast } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import SubmitButton from "@/components/SubmitButton";
import UserAvatar from "@/components/UserAvatar";
import useDeleteCardComment from "@/controllers/api/card/comment/useDeleteCardComment";
import useUpdateCardComment from "@/controllers/api/card/comment/useUpdateCardComment";
import { API_ROUTES } from "@/controllers/constants";
import useCardCommentUpdatedHandlers from "@/controllers/socket/card/comment/useCardCommentUpdatedHandlers";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project, ProjectCardComment } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { format, formatDateDistance } from "@/core/utils/StringUtils";
import BoardCommentReaction from "@/pages/BoardPage/components/card/comment/BoardCommentReaction";
import { useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardComment(): JSX.Element {
    return (
        <div className="mt-4 grid grid-cols-[theme(spacing.8),1fr] gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Flex direction="col" gap="1">
                <Flex gap="1" items="center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-36" />
                </Flex>
                <Skeleton className="h-12 w-1/2 rounded-lg rounded-ss-none" />
            </Flex>
        </div>
    );
}

export interface IBoardCommentProps {
    comment: ProjectCardComment.IBoard;
    deletedComment: (commentUID: string) => void;
}

function BoardComment({ comment, deletedComment }: IBoardCommentProps): JSX.Element {
    const { projectUID, card, socket, currentUser, hasRoleAction, currentEditor, setCurrentEditor, replyRef } = useBoardCard();
    const [t, i18n] = useTranslation();
    const valueRef = useRef<IEditorContent>(comment.content);
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const editorElementRef = useRef<HTMLDivElement | null>(null);
    const isEditing = currentEditor === comment.uid;
    const [isValidating, setIsValidating] = useState(false);
    const [_, forceUpdate] = useReducer((x) => x + 1, 0);
    const { mutate: updateCommentMutate } = useUpdateCardComment();
    const { mutateAsync: deleteCommentMutateAsync } = useDeleteCardComment();
    const { on: onCardCommentUpdated } = useCardCommentUpdatedHandlers({
        socket,
        projectUID,
        cardUID: card.uid,
        callback: (data) => {
            if (comment.uid !== data.comment_uid) {
                return;
            }

            if (comment.content !== data.content) {
                comment.content = data.content;
                comment.commented_at = data.commented_at;
                comment.is_edited = true;
                forceUpdate();
            }
        },
    });

    useEffect(() => {
        const { off } = onCardCommentUpdated();

        return () => {
            off();
        };
    }, []);

    const cancelEditing = () => {
        setValue(comment.content);
        setCurrentEditor("");
    };

    const saveComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        if (comment.content === valueRef.current) {
            setIsValidating(false);
            return;
        }

        updateCommentMutate(
            {
                project_uid: projectUID,
                card_uid: card.uid,
                comment_uid: comment.uid,
                content: valueRef.current,
            },
            {
                onSuccess: () => {
                    comment.content = { ...valueRef.current };
                    Toast.Add.success(t("card.Comment updated successfully."));
                    cancelEditing();
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                        },
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("card.Comment not found."));
                        },
                    });

                    handle(error);
                    cancelEditing();
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    const deleteComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        const promise = deleteCommentMutateAsync({
            project_uid: projectUID,
            card_uid: card.uid,
            comment_uid: comment.uid,
        });

        const toastId = Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                let message = "";
                const { handle } = setupApiErrorHandler({
                    [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                        message = t("errors.Forbidden");
                    },
                    [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                        message = t("card.Comment not found.");
                    },
                    nonApiError: () => {
                        message = t("errors.Unknown error");
                    },
                    wildcardError: () => {
                        message = t("errors.Internal server error");
                    },
                });

                handle(error);
                return message;
            },
            success: () => {
                deletedComment(comment.uid);
                return t("card.Comment deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
                Toast.Add.dismiss(toastId);
            },
        });
    };

    return (
        <div className="grid grid-cols-[theme(spacing.8),1fr] gap-2">
            <UserAvatar.Root avatarSize="sm" user={comment.user}>
                <UserAvatar.List>
                    <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                </UserAvatar.List>
            </UserAvatar.Root>
            <Flex
                direction="col"
                gap="2"
                className={cn(
                    "max-w-[calc(100vw_-_theme(spacing.20))]",
                    "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.52)_-_theme(spacing.2))]",
                    "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.52)_-_theme(spacing.2))]"
                )}
            >
                <Flex gap="2" items="center">
                    <span className="text-sm font-bold">
                        {comment.user.firstname} {comment.user.lastname}
                    </span>
                    <span className="text-xs text-accent-foreground/50">
                        {formatDateDistance(i18n, t, comment.commented_at)}
                        {comment.is_edited && ` (${t("card.edited")})`}
                    </span>
                </Flex>
                <Flex
                    className={cn(
                        "rounded-lg rounded-ss-none bg-accent/70 px-3 py-1.5",
                        isEditing ? "rounded-lg border bg-transparent p-0" : "w-fit max-w-full"
                    )}
                >
                    <PlateEditor
                        value={comment.content}
                        currentUser={currentUser}
                        mentionableUsers={card.project_members}
                        className={isEditing ? "h-full max-h-[min(70vh,300px)] min-h-[min(70vh,300px)] overflow-y-auto px-6 py-3" : ""}
                        readOnly={!isEditing}
                        socket={socket}
                        baseSocketEvent="board:card"
                        chatEventKey={`card-comment-${card.uid}`}
                        copilotEventKey={`card-comment-${comment.uid}`}
                        uploadPath={format(API_ROUTES.BOARD.CARD.ATTACHMENT.UPLOAD, { uid: projectUID, card_uid: card.uid })}
                        setValue={setValue}
                        editorElementRef={editorElementRef}
                    />
                </Flex>
                <Flex items="center" gap="2">
                    {isEditing ? (
                        <>
                            <SubmitButton type="button" onClick={saveComment} isValidating={isValidating}>
                                {t("common.Save")}
                            </SubmitButton>
                            <Button variant="secondary" onClick={cancelEditing} disabled={isValidating}>
                                {t("common.Cancel")}
                            </Button>
                        </>
                    ) : (
                        <>
                            <BoardCommentReaction comment={comment} />
                            {hasRoleAction(Project.ERoleAction.READ) &&
                                currentUser.id !== comment.user.id &&
                                card.project_members.find((user) => user.id === comment.user.id) && (
                                    <>
                                        <Separator orientation="vertical" className="h-1/2" />
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-5 p-0 text-accent-foreground/50"
                                            onClick={() => replyRef.current?.(comment.user)}
                                        >
                                            {t("card.Reply")}
                                        </Button>
                                    </>
                                )}
                            {(currentUser.id === comment.user.id || currentUser.is_admin) && (
                                <>
                                    <Separator orientation="vertical" className="h-1/2" />
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-5 p-0 text-accent-foreground/50"
                                        onClick={() => {
                                            setCurrentEditor(comment.uid);
                                            setTimeout(() => {
                                                if (editorElementRef.current) {
                                                    editorElementRef.current.focus();
                                                }
                                            }, 50);
                                        }}
                                        disabled={isValidating}
                                    >
                                        {t("common.Edit")}
                                    </Button>
                                    <Separator orientation="vertical" className="h-1/2" />
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-5 p-0 text-accent-foreground/50"
                                        onClick={deleteComment}
                                        disabled={isValidating}
                                    >
                                        {t("common.Delete")}
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </Flex>
            </Flex>
        </div>
    );
}

export default BoardComment;
