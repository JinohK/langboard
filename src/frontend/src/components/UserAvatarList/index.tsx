import { Box, Button, Flex, HoverCard, ScrollArea, Separator, Skeleton } from "@/components/base";
import { AvatarVariants } from "@/components/base/Avatar";
import { LabelBadge } from "@/components/LabelBadge";
import UserAvatar, { TUserAvatarProps } from "@/components/UserAvatar";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { User } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { createShortUUID } from "@/core/utils/StringUtils";
import { forwardRef, Fragment, memo, useState } from "react";

const SPACING_MAP = {
    1: "-space-x-5",
    2: "-space-x-4",
    3: "-space-x-3",
    4: "-space-x-2",
    5: "-space-x-1",
    none: "",
};

export interface ISkeletonUserAvatarListProps {
    count: number;
    size?: TUserAvatarProps["avatarSize"];
    spacing?: "1" | "2" | "3" | "4" | "5" | "none";
    className?: string;
}

export const SkeletonUserAvatarList = ({ count, size, spacing = "none", className = "" }: ISkeletonUserAvatarListProps) => {
    return (
        <Flex className={cn("rtl:space-x-reverse", SPACING_MAP[spacing])}>
            {Array.from({ length: count }).map(() => (
                <Skeleton key={createShortUUID()} display="inline-block" className={cn(AvatarVariants({ size }), className)} />
            ))}
        </Flex>
    );
};

export interface IUserAvatarListProps extends Omit<React.ComponentProps<typeof Flex>, "size"> {
    users: User.TModel[];
    maxVisible: number;
    size?: TUserAvatarProps["avatarSize"];
    spacing?: "1" | "2" | "3" | "4" | "5" | "none";
    listAlign?: TUserAvatarProps["listAlign"];
    projectUID?: string;
}

export const UserAvatarList = memo(
    forwardRef<HTMLDivElement, IUserAvatarListProps>(
        ({ maxVisible, className, users, size = "default", spacing = "2", listAlign, projectUID, ...props }: IUserAvatarListProps, ref) => {
            const moreUsersCount = users.length - maxVisible;

            return (
                <Flex position="relative" className={cn("rtl:space-x-reverse", SPACING_MAP[spacing], className)} ref={ref} {...props}>
                    {users.slice(0, maxVisible).map((user) => (
                        <UserAvatar.Root
                            key={`user-avatar-${user.username}-${createShortUUID()}`}
                            user={user}
                            avatarSize={size}
                            listAlign={listAlign}
                            className="hover:z-50"
                        >
                            <UserAvatarDefaultList user={user} projectUID={projectUID} />
                        </UserAvatar.Root>
                    ))}
                    {moreUsersCount > 0 && <UserAvatarMoreList users={users} maxVisible={maxVisible} size={size} listAlign={listAlign} />}
                </Flex>
            );
        }
    )
);

export interface IUserAvatarBadgeListProps extends Omit<IUserAvatarListProps, "size" | "spacing"> {}

export const UserAvatarBadgeList = memo(
    forwardRef<HTMLDivElement, IUserAvatarBadgeListProps>(({ maxVisible, className, users, listAlign, projectUID, ...props }, ref) => {
        const moreUsersCount = users.length - maxVisible;

        return (
            <Flex items="center" gap="1.5" position="relative" className={className} ref={ref} {...props}>
                {users.slice(0, maxVisible).map((user) => (
                    <UserAvatar.Root
                        key={`user-avatar-${user.username}-${createShortUUID()}`}
                        user={user}
                        withName
                        noAvatar
                        labelClassName={cn(
                            "relative rounded-xl border text-xs px-2",
                            "after:absolute after:left-0 after:top-0 after:z-0 after:opacity-70",
                            "after:bg-[var(--avatar-bg)] after:text-[var(--avatar-text-color)]",
                            "after:rounded-xl after:size-full"
                        )}
                        nameClassName="relative z-10"
                    >
                        <UserAvatarDefaultList user={user} projectUID={projectUID} />
                    </UserAvatar.Root>
                ))}
                {moreUsersCount > 0 && <UserAvatarMoreList users={users} maxVisible={maxVisible} size="sm" listAlign={listAlign} isBadge />}
            </Flex>
        );
    })
);

interface IUserAvatarMoreList {
    users: User.TModel[];
    maxVisible: number;
    size?: TUserAvatarProps["avatarSize"];
    listAlign?: TUserAvatarProps["listAlign"];
    isBadge?: bool;
    projectUID?: string;
}

const UserAvatarMoreList = memo(({ maxVisible, users, size = "default", listAlign, isBadge, projectUID }: IUserAvatarMoreList) => {
    const [isOpened, setIsOpened] = useState(false);
    const moreUsersCount = users.length - maxVisible;
    const moreUsersCountText = moreUsersCount > 99 ? "99" : moreUsersCount;

    return (
        <HoverCard.Root open={isOpened} onOpenChange={setIsOpened}>
            <HoverCard.Trigger asChild>
                {isBadge ? (
                    <Box cursor="pointer" onClick={() => setIsOpened(!isOpened)}>
                        <LabelBadge
                            name={`+${moreUsersCountText}`}
                            color="hsl(var(--secondary))"
                            textColor="hsl(var(--secondary-foreground))"
                            noTooltip
                        />
                    </Box>
                ) : (
                    <Button
                        variant="secondary"
                        className={cn(AvatarVariants({ size }), "z-10 m-0 select-none border-none p-0")}
                        onClick={() => setIsOpened(!isOpened)}
                    >
                        +{moreUsersCountText}
                    </Button>
                )}
            </HoverCard.Trigger>
            <HoverCard.Content className="z-50 w-auto p-0" align="end">
                <ScrollArea.Root>
                    <Box maxH="52" minW="40" py="1">
                        {users.slice(maxVisible).map((user, i) => (
                            <Fragment key={`user-avatar-${user.username}-${createShortUUID()}`}>
                                {i !== 0 && <Separator className="my-1 h-px bg-muted" />}
                                <UserAvatar.Root
                                    user={user}
                                    avatarSize="xs"
                                    listAlign={listAlign}
                                    withName
                                    labelClassName="justify-start gap-2 px-3 py-1 hover:bg-accent/70 cursor-pointer"
                                >
                                    <UserAvatarDefaultList user={user} projectUID={projectUID} />
                                </UserAvatar.Root>
                            </Fragment>
                        ))}
                    </Box>
                </ScrollArea.Root>
            </HoverCard.Content>
        </HoverCard.Root>
    );
});
