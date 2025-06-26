import { Button, Flex, Separator, SubmitButton, Toast } from "@/components/base";
import useDeleteCardComment from "@/controllers/api/card/comment/useDeleteCardComment";
import useUpdateCardComment from "@/controllers/api/card/comment/useUpdateCardComment";
import setupApiErrorHandler from "@/core/helpers/setupApiErrorHandler";
import { Project } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import BoardCommentReaction from "@/pages/BoardPage/components/card/comment/BoardCommentReaction";
import { IBoardCommentContextParams } from "@/pages/BoardPage/components/card/comment/types";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function BoardCommentFooter(): JSX.Element {
    const { params } = ModelRegistry.ProjectCardComment.useContext<IBoardCommentContextParams>();
    const { isEditing } = params;

    return (
        <Flex items="center" gap="2">
            {isEditing ? <BoardCommentFooterEditButtons /> : <BoardCommentFooterActions />}
        </Flex>
    );
}

function BoardCommentFooterEditButtons() {
    const { projectUID, card, setCurrentEditor } = useBoardCard();
    const [t] = useTranslation();
    const { model: comment, params } = ModelRegistry.ProjectCardComment.useContext<IBoardCommentContextParams>();
    const { valueRef } = params;
    const [isValidating, setIsValidating] = useState(false);
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const { mutate: updateCommentMutate } = useUpdateCardComment();

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
                    Toast.Add.success(t("successes.Comment updated successfully."));
                    cancelEditing();
                },
                onError: (error) => {
                    const { handle } = setupApiErrorHandler({});

                    handle(error);
                    cancelEditing();
                },
                onSettled: () => {
                    setIsValidating(false);
                },
            }
        );
    };

    return (
        <>
            <SubmitButton type="button" onClick={saveComment} isValidating={isValidating}>
                {t("common.Save")}
            </SubmitButton>
            <Button variant="secondary" onClick={cancelEditing} disabled={isValidating}>
                {t("common.Cancel")}
            </Button>
        </>
    );
}

function BoardCommentFooterActions() {
    const { projectUID, card, currentUser, hasRoleAction, setCurrentEditor, replyRef } = useBoardCard();
    const [t] = useTranslation();
    const { model: comment, params } = ModelRegistry.ProjectCardComment.useContext<IBoardCommentContextParams>();
    const { model: commentAuthor } = ModelRegistry.User.useContext();
    const { deletedComment } = params;
    const projectMembers = card.useForeignField("project_members");
    const [isValidating, setIsValidating] = useState(false);
    const editorComponentRef = useRef<HTMLDivElement>(null);
    const canEdit = currentUser.uid === commentAuthor.uid || currentUser.is_admin;
    const { mutateAsync: deleteCommentMutateAsync } = useDeleteCardComment({ interceptToast: true });

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
                const { handle } = setupApiErrorHandler({}, messageRef);

                handle(error);
                return messageRef.message;
            },
            success: () => {
                deletedComment(comment.uid);
                return t("successes.Comment deleted successfully.");
            },
            finally: () => {
                setIsValidating(false);
            },
        });
    };

    return (
        <>
            <BoardCommentReaction comment={comment} />
            {hasRoleAction(Project.ERoleAction.Read) &&
                currentUser.uid !== commentAuthor.uid &&
                currentUser.isValidUser() &&
                projectMembers.find((user) => user.uid === commentAuthor.uid) && (
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
                    <Button variant="link" size="sm" className="h-5 p-0 text-accent-foreground/50" onClick={deleteComment} disabled={isValidating}>
                        {t("common.Delete")}
                    </Button>
                </>
            )}
        </>
    );
}

export default BoardCommentFooter;
