import { Button, Flex, Separator, Skeleton } from "@/components/base";
import Markdown from "@/components/Markdown";
import ReactionCounter from "@/components/ReactionCounter";
import UserAvatar from "@/components/UserAvatar";
import { IBoardCardComment } from "@/controllers/board/useGetCardComments";
import useRoleActionFilter from "@/core/hooks/useRoleActionFilter";
import { Project } from "@/core/models";
import { IAuthUser } from "@/core/providers/AuthProvider";
import { IBaseCardRelatedComponentProps } from "@/pages/BoardPage/components/card/types";
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

export interface IBoardCommentProps extends IBaseCardRelatedComponentProps {
    comment: IBoardCardComment;
    currentUser: IAuthUser;
}

function BoardComment({ projectUID, card, currentUser, currentUserRoleActions, socket, comment }: IBoardCommentProps): JSX.Element {
    const [t] = useTranslation();
    const { hasRoleAction } = useRoleActionFilter(currentUserRoleActions);

    return (
        <div className="grid grid-cols-[theme(spacing.8),1fr] gap-2">
            <UserAvatar.Root avatarSize="sm" user={comment.user}>
                <UserAvatar.List>
                    <UserAvatar.ListLabel>{comment.user.firstname}</UserAvatar.ListLabel>
                </UserAvatar.List>
            </UserAvatar.Root>
            <Flex direction="col" gap="2">
                <Flex gap="1" items="center">
                    <span className="text-sm font-bold">
                        {comment.user.firstname} {comment.user.lastname}
                    </span>
                    <span className="text-xs text-accent-foreground/50">
                        {comment.commented_at.toLocaleString()}
                        {comment.is_edited && ` (${t("card.edited")})`}
                    </span>
                </Flex>
                <div className="inline-block w-fit rounded-lg rounded-ss-none bg-accent/70 px-3 py-1.5">
                    <Markdown>{comment.content}</Markdown>
                </div>
                <Flex items="center" gap="2">
                    <ReactionCounter
                        reactions={comment.reactions}
                        isActiveReaction={(_, data) => {
                            return data.includes(currentUser.id);
                        }}
                        toggleCallback={(reaction) => {}}
                    />
                    {hasRoleAction(Project.ERoleAction.CARD_WRITE) && (
                        <>
                            <Separator orientation="vertical" className="h-1/2" />
                            <Button variant="link" size="sm" className="h-5 p-0 text-accent-foreground/50">
                                {t("card.Reply")}
                            </Button>
                        </>
                    )}
                    {(currentUser.id === comment.user.id || currentUser.is_admin) && (
                        <>
                            <Separator orientation="vertical" className="h-1/2" />
                            <Button variant="link" size="sm" className="h-5 p-0 text-accent-foreground/50">
                                {t("common.Edit")}
                            </Button>
                            <Separator orientation="vertical" className="h-1/2" />
                            <Button variant="link" size="sm" className="h-5 p-0 text-accent-foreground/50">
                                {t("common.Delete")}
                            </Button>
                        </>
                    )}
                </Flex>
            </Flex>
        </div>
    );
}

export default BoardComment;
