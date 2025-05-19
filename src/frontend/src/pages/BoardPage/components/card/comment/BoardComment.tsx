import { Box, Button, Flex, Separator, Skeleton, SubmitButton, Toast } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import useDeleteCardComment from "@/controllers/api/card/comment/useDeleteCardComment";
import useUpdateCardComment from "@/controllers/api/card/comment/useUpdateCardComment";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { BotModel, Project, ProjectCardComment, User } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCommentReaction from "@/pages/BoardPage/components/card/comment/BoardCommentReaction";
import { memo, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardComment(): JSX.Element {
    return (
        <Box mt="4" display="grid" gap="2" className="grid-cols-[theme(spacing.8),1fr]">
            <Skeleton size="8" rounded="full" />
            <Flex direction="col" gap="1">
                <Flex gap="1" items="center">
                    <Skeleton h="5" w="24" />
                    <Skeleton h="4" w="36" />
                </Flex>
                <Skeleton h="12" rounded="lg" className="w-1/2 rounded-ss-none" />
            </Flex>
        </Box>
    );
}

export interface IBoardCommentProps {
    comment: ProjectCardComment.TModel;
    deletedComment: (commentUID: string) => void;
}

const BoardComment = memo(({ comment, deletedComment }: IBoardCommentProps): JSX.Element => {
    const { projectUID, card, currentUser, hasRoleAction, editorsRef, setCurrentEditor, replyRef } = useBoardCard();
    const [isEditing, setIsEditing] = useState(false);
    const [t] = useTranslation();
    const projectMembers = card.useForeignField<User.TModel>("project_members");
    const projectBots = card.useForeignField<BotModel.TModel>("project_bots");
    const mentionables = useMemo(() => [...projectMembers, ...projectBots.map((bot) => bot.as_user)], [projectMembers, projectBots]);
    const content = comment.useField("content");
    const commentUsers = comment.useForeignField<User.TModel>("user");
    const commentBots = comment.useForeignField<BotModel.TModel>("bot");
    const commentAuthor = commentUsers[0] || commentBots[0].as_user;
    const valueRef = useRef<IEditorContent>(content);
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const editorComponentRef = useRef<HTMLDivElement>(null);
    const [isValidating, setIsValidating] = useState(false);
    const { mutate: updateCommentMutate } = useUpdateCardComment();
    const { mutateAsync: deleteCommentMutateAsync } = useDeleteCardComment();
    const canEdit = currentUser.uid === commentAuthor.uid || currentUser.is_admin;

    editorsRef.current[comment.uid] = (editing: bool) => {
        if (canEdit) {
            setIsEditing(editing);
        }
    };

    const cancelEditing = () => {
        setValue(comment.content);
        setCurrentEditor("");
    };

    const saveComment = () => {
        if (isValidating) {
            return;
        }

        setIsValidating(true);

        if (!valueRef.current.content.trim().length) {
            Toast.Add.error(t("card.errors.Comment content cannot be empty."));
            setIsValidating(false);
            return;
        }

        if (comment.content.content.trim() === valueRef.current.content.trim()) {
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
                    Toast.Add.success(t("card.successes.Comment updated successfully."));
                    cancelEditing();
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => {
                            Toast.Add.error(t("errors.Forbidden"));
                        },
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => {
                            Toast.Add.error(t("card.errors.Comment not found."));
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

        Toast.Add.promise(promise, {
            loading: t("common.Deleting..."),
            error: (error) => {
                const messageRef = { message: "" };
                const { handle } = setupApiErrorHandler(
                    {
                        [EHttpStatus.HTTP_403_FORBIDDEN]: () => t("errors.Forbidden"),
                        [EHttpStatus.HTTP_404_NOT_FOUND]: () => t("card.errors.Comment not found."),
                    },
                    messageRef
                );

                handle(error);
                return messageRef.message;
            },
            success: () => {
                deletedComment(comment.uid);
                return t("card.successes.Comment deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <Box display="grid" gap="2" className="grid-cols-[theme(spacing.8),1fr]">
            <Box>
                <BoardCommentUserAvatar user={commentAuthor} projectUID={projectUID} />
            </Box>
            <Flex
                direction="col"
                gap="2"
                className={cn(
                    "max-w-[calc(100vw_-_theme(spacing.20))]",
                    "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.52)_-_theme(spacing.2))]",
                    "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.52)_-_theme(spacing.2))]"
                )}
            >
                <BoardCommentHeader comment={comment} user={commentAuthor} />
                <Flex
                    px="3"
                    py="1.5"
                    rounded="lg"
                    className={cn("rounded-ss-none bg-accent/70", isEditing ? "border bg-transparent p-0" : "w-fit max-w-full")}
                >
                    <PlateEditor
                        value={comment.content}
                        currentUser={currentUser}
                        mentionables={mentionables}
                        className={isEditing ? "h-full max-h-[min(70vh,300px)] min-h-[min(70vh,300px)] overflow-y-auto px-6 py-3" : ""}
                        readOnly={!isEditing}
                        editorType="card-comment"
                        form={{
                            project_uid: projectUID,
                            card_uid: card.uid,
                            comment_uid: comment.uid,
                        }}
                        setValue={setValue}
                        editorComponentRef={editorComponentRef}
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
                            {hasRoleAction(Project.ERoleAction.Read) &&
                                currentUser.uid !== commentAuthor.uid &&
                                currentUser.isValidUser() &&
                                card.project_members.find((user) => user.uid === commentAuthor.uid) && (
                                    <>
                                        <Separator orientation="vertical" className="h-1/2" />
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-5 p-0 text-accent-foreground/50"
                                            onClick={() => replyRef.current?.(commentAuthor)}
                                        >
                                            {t("card.Reply")}
                                        </Button>
                                    </>
                                )}
                            {canEdit && (
                                <>
                                    <Separator orientation="vertical" className="h-1/2" />
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-5 p-0 text-accent-foreground/50"
                                        onClick={() => {
                                            setCurrentEditor(comment.uid);
                                            setTimeout(() => {
                                                if (editorComponentRef.current) {
                                                    editorComponentRef.current.focus();
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
        </Box>
    );
});

const BoardCommentUserAvatar = memo(({ user, projectUID }: { user: User.TModel; projectUID: string }): JSX.Element => {
    return (
        <UserAvatar.Root avatarSize="sm" user={user}>
            <UserAvatarDefaultList user={user} projectUID={projectUID} />
        </UserAvatar.Root>
    );
});

const BoardCommentHeader = memo(({ comment, user }: { comment: ProjectCardComment.TModel; user: User.TModel }): JSX.Element => {
    const [t] = useTranslation();
    const firstname = user.useField("firstname");
    const lastname = user.useField("lastname");
    const rawCommentedAt = comment.useField("commented_at");
    const isEdited = comment.useField("is_edited");
    const commentedAt = useUpdateDateDistance(rawCommentedAt);

    return (
        <Flex gap="2" items="center">
            <span className="text-sm font-bold">
                {firstname} {lastname}
            </span>
            <span className="text-xs text-accent-foreground/50">
                {commentedAt}
                {isEdited && ` (${t("card.edited")})`}
            </span>
        </Flex>
    );
});

export default BoardComment;
