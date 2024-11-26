import { Button, Flex, Separator, Skeleton } from "@/components/base";
import { PlateEditor, TEditor } from "@/components/Editor/plate-editor";
import ReactionCounter from "@/components/ReactionCounter";
import UserAvatar from "@/components/UserAvatar";
import { IBoardCardComment } from "@/controllers/board/useGetCardComments";
import { API_ROUTES, SOCKET_CLIENT_EVENTS } from "@/controllers/constants";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import { IEditorContent } from "@/core/models/Base";
import { useBoardCard } from "@/core/providers/BoardCardProvider";
import { cn } from "@/core/utils/ComponentUtils";
import { format, formatDateDistance } from "@/core/utils/StringUtils";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export function SkeletonBoardComment(): JSX.Element {
    return (
        <div className="grid grid-cols-[theme(spacing.8),1fr] gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Flex direction="col" gap="1">
                <Flex gap="1" items="center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20" />
                </Flex>
                <Skeleton className="h-12 w-1/2 rounded-lg rounded-ss-none" />
            </Flex>
        </div>
    );
}

export interface IBoardCommentProps {
    comment: IBoardCardComment;
}

function BoardComment({ comment }: IBoardCommentProps): JSX.Element {
    const { projectUID, card, socket, currentUser, currentUserRoleActions, currentEditor, setCurrentEditor, replyRef } = useBoardCard();
    const [t, i18n] = useTranslation();
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);
    const valueRef = useRef<IEditorContent>(comment.content);
    const setValue = (value: IEditorContent) => {
        valueRef.current = value;
    };
    const editorRef = useRef<TEditor>();
    const editorElementRef = useRef<HTMLDivElement | null>(null);
    const isEditing = currentEditor === comment.uid;

    const cancelEditing = () => {
        setValue(comment.content);
        setCurrentEditor("");
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
                    "sm:max-w-[calc(theme(screens.sm)_-_theme(spacing.20))]",
                    "lg:max-w-[calc(theme(screens.md)_-_theme(spacing.20))]"
                )}
            >
                <Flex gap="1" items="center">
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
                        baseSocketEvent={SOCKET_CLIENT_EVENTS.BOARD.CARD.BASE_EDITOR}
                        uploadPath={format(API_ROUTES.BOARD.CARD.UPLOAD_ATTACHMENT, { uid: projectUID, card_uid: card.uid })}
                        setValue={setValue}
                        editorRef={editorRef}
                        editorElementRef={editorElementRef}
                    />
                </Flex>
                <Flex items="center" gap="2">
                    {isEditing ? (
                        <>
                            <Button>{t("common.Save")}</Button>
                            <Button variant="secondary" onClick={cancelEditing}>
                                {t("common.Cancel")}
                            </Button>
                        </>
                    ) : (
                        <>
                            <ReactionCounter
                                reactions={comment.reactions}
                                isActiveReaction={(_, data) => {
                                    return data.includes(currentUser.id);
                                }}
                                toggleCallback={(reaction) => {}}
                            />
                            {hasRoleAction(Project.ERoleAction.READ) &&
                                currentUser.id !== comment.user.id &&
                                card.project_members.find((user) => user.id === comment.user.id) && (
                                    <>
                                        <Separator orientation="vertical" className="h-1/2" />
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-5 p-0 text-accent-foreground/50"
                                            onClick={() => replyRef?.current?.(comment.user)}
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
                                    >
                                        {t("common.Edit")}
                                    </Button>
                                    <Separator orientation="vertical" className="h-1/2" />
                                    <Button variant="link" size="sm" className="h-5 p-0 text-accent-foreground/50">
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
