import { Box, Flex, Skeleton } from "@/components/base";
import { PlateEditor } from "@/components/Editor/plate-editor";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import useUpdateDateDistance from "@/core/hooks/useUpdateDateDistance";
import { BotModel, ProjectCardComment, User } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { ModelRegistry } from "@/core/models/ModelRegistry";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import BoardCommentFooter from "@/pages/BoardPage/components/card/comment/BoardCommentFooter";
import { memo, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardComment({ ref }: { ref?: React.Ref<HTMLDivElement> }): JSX.Element {
    return (
        <Box mt="4" display="grid" gap="2" className="grid-cols-[theme(spacing.8),1fr]" ref={ref}>
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
    const { projectUID, card, currentUser, editorsRef } = useBoardCard();
    const [isEditing, setIsEditing] = useState(false);
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
    const canEdit = currentUser.uid === commentAuthor.uid || currentUser.is_admin;

    editorsRef.current[comment.uid] = (editing: bool) => {
        if (canEdit) {
            setIsEditing(editing);
        }
    };

    return (
        <ModelRegistry.ProjectCardComment.Provider model={comment} params={{ deletedComment, valueRef, isEditing }}>
            <ModelRegistry.User.Provider model={commentAuthor}>
                <Box display="grid" gap="2" className="grid-cols-[theme(spacing.8),1fr]">
                    <Box>
                        <BoardCommentUserAvatar projectUID={projectUID} />
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
                        <BoardCommentHeader />
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
                        <BoardCommentFooter />
                    </Flex>
                </Box>
            </ModelRegistry.User.Provider>
        </ModelRegistry.ProjectCardComment.Provider>
    );
});

function BoardCommentUserAvatar({ projectUID }: { projectUID: string }): JSX.Element {
    const { model: user } = ModelRegistry.User.useContext();

    return (
        <UserAvatar.Root avatarSize="sm" user={user}>
            <UserAvatarDefaultList user={user} projectUID={projectUID} />
        </UserAvatar.Root>
    );
}

function BoardCommentHeader(): JSX.Element {
    const [t] = useTranslation();
    const { model: user } = ModelRegistry.User.useContext();
    const { model: comment } = ModelRegistry.ProjectCardComment.useContext();
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
}

export default BoardComment;
