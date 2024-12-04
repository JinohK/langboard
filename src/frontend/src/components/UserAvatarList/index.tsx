import { Button, Flex, HoverCard, ScrollArea, Separator, Skeleton } from "@/components/base";
import { AvatarVariants } from "@/components/base/Avatar";
import UserAvatar, { TUserAvatarProps } from "@/components/UserAvatar";
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
}

export const SkeletonUserAvatarList = ({ count, size, spacing = "none" }: ISkeletonUserAvatarListProps) => {
    return (
        <Flex className={cn("rtl:space-x-reverse", SPACING_MAP[spacing])}>
            {Array.from({ length: count }).map(() => (
                <Skeleton key={createShortUUID()} className={cn("inline-block", AvatarVariants({ size }))} />
            ))}
        </Flex>
    );
};

export interface IUserAvatarListProps extends React.HTMLAttributes<HTMLDivElement> {
    users: User.Interface[];
    maxVisible: number;
    size?: TUserAvatarProps["avatarSize"];
    spacing?: "1" | "2" | "3" | "4" | "5" | "none";
    listAlign?: TUserAvatarProps["listAlign"];
}

const UserAvatarList = memo(
    forwardRef<HTMLDivElement, IUserAvatarListProps>(
        ({ maxVisible, className, users, size = "default", spacing = "2", listAlign, ...props }: IUserAvatarListProps, ref) => {
            const moreUsersCount = users.length - maxVisible;

            return (
                <Flex className={cn("relative rtl:space-x-reverse", SPACING_MAP[spacing], className)} ref={ref} {...props}>
                    {users.slice(0, maxVisible).map((user) => (
                        <UserAvatar.Root
                            key={`user-avatar-${user.username}-${createShortUUID()}`}
                            user={user}
                            avatarSize={size}
                            listAlign={listAlign}
                            className="hover:z-50"
                        >
                            <UserAvatar.List>
                                <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                            </UserAvatar.List>
                        </UserAvatar.Root>
                    ))}
                    {moreUsersCount > 0 && <UserAvatarMoreList users={users} maxVisible={maxVisible} size={size} listAlign={listAlign} />}
                </Flex>
            );
        }
    )
);

interface IUserAvatarMoreList {
    users: User.Interface[];
    maxVisible: number;
    size?: TUserAvatarProps["avatarSize"];
    listAlign?: TUserAvatarProps["listAlign"];
}

const UserAvatarMoreList = memo(({ maxVisible, users, size = "default", listAlign }: IUserAvatarMoreList) => {
    const [isOpened, setIsOpened] = useState(false);
    const moreUsersCount = users.length - maxVisible;

    return (
        <HoverCard.Root open={isOpened} onOpenChange={setIsOpened}>
            <HoverCard.Trigger asChild>
                <Button
                    variant="secondary"
                    className={cn(AvatarVariants({ size }), "z-10 m-0 select-none border-none p-0")}
                    onClick={() => setIsOpened(!isOpened)}
                >
                    +{moreUsersCount > 99 ? "99" : moreUsersCount}
                </Button>
            </HoverCard.Trigger>
            <HoverCard.Content className="z-50 w-auto p-0" align="end">
                <ScrollArea.Root>
                    <div className="max-h-52 min-w-40 py-1">
                        {users.slice(maxVisible).map((user) => (
                            <Fragment key={`user-avatar-${user.username}-${createShortUUID()}`}>
                                <UserAvatar.Root
                                    user={user}
                                    avatarSize="xs"
                                    listAlign={listAlign}
                                    withName
                                    labelClassName="justify-start gap-2 px-3 py-1 hover:bg-accent/70 cursor-pointer"
                                >
                                    <UserAvatar.List>
                                        <UserAvatar.ListLabel>test</UserAvatar.ListLabel>
                                    </UserAvatar.List>
                                </UserAvatar.Root>
                                <Separator className="my-1 h-px bg-muted" />
                            </Fragment>
                        ))}
                    </div>
                </ScrollArea.Root>
            </HoverCard.Content>
        </HoverCard.Root>
    );
});

export default UserAvatarList;
