import { Box, Button, Flex, HoverCard, ScrollArea, Separator, Skeleton } from "@/components/base";
import { AvatarVariants } from "@/components/base/Avatar";
import { LabelBadge } from "@/components/LabelBadge";
import UserAvatar from "@/components/UserAvatar";
import { IUserAvatarProps } from "@/components/UserAvatar/types";
import UserAvatarDefaultList from "@/components/UserAvatarDefaultList";
import { IUserAvatarDefaultListProviderProps } from "@/components/UserAvatarDefaultList/Provider";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { cn } from "@/core/utils/ComponentUtils";
import { Utils } from "@langboard/core/utils";
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
    size?: IUserAvatarProps["avatarSize"];
    spacing?: "1" | "2" | "3" | "4" | "5" | "none";
    className?: string;
}

export const SkeletonUserAvatarList = ({ count, size, spacing = "none", className = "" }: ISkeletonUserAvatarListProps) => {
    return (
        <Flex className={cn("rtl:space-x-reverse", SPACING_MAP[spacing])}>
            {Array.from({ length: count }).map(() => (
                <Skeleton key={Utils.String.Token.shortUUID()} display="inline-block" className={cn(AvatarVariants({ size }), className)} />
            ))}
        </Flex>
    );
};

export interface IUserAvatarListProps extends Omit<React.ComponentProps<typeof Flex>, "size"> {
    userOrBots: TUserLikeModel[];
    maxVisible: number;
    size?: IUserAvatarProps["avatarSize"];
    spacing?: "1" | "2" | "3" | "4" | "5" | "none";
    listAlign?: IUserAvatarProps["listAlign"];
    scope?: IUserAvatarDefaultListProviderProps["scope"];
    avatarHoverProps?: IUserAvatarProps["hoverProps"];
    onlyList?: bool;
}

export const UserAvatarList = memo(
    forwardRef<HTMLDivElement, IUserAvatarListProps>((props: IUserAvatarListProps, ref) => {
        const {
            maxVisible,
            className,
            userOrBots,
            size = "default",
            spacing = "2",
            listAlign,
            scope,
            avatarHoverProps,
            onlyList,
            ...flexProps
        } = props;
        const moreUsersCount = userOrBots.length - maxVisible;

        return (
            <Flex position="relative" className={cn("rtl:space-x-reverse", SPACING_MAP[spacing], className)} ref={ref} {...flexProps}>
                {userOrBots.slice(0, maxVisible).map((userOrBot) => (
                    <UserAvatar.Root
                        key={`user-avatar-${userOrBot.MODEL_NAME}-${userOrBot.uid}`}
                        userOrBot={userOrBot}
                        avatarSize={size}
                        listAlign={listAlign}
                        className="hover:z-50"
                        hoverProps={avatarHoverProps}
                        onlyAvatar={onlyList}
                    >
                        <UserAvatarDefaultList userOrBot={userOrBot} scope={scope} />
                    </UserAvatar.Root>
                ))}
                {moreUsersCount > 0 && <UserAvatarMoreList {...props} />}
            </Flex>
        );
    })
);

interface IUserAvatarMoreList extends IUserAvatarListProps {
    isBadge?: bool;
}

const UserAvatarMoreList = memo(({ maxVisible, userOrBots, size = "default", listAlign, isBadge, scope, avatarHoverProps }: IUserAvatarMoreList) => {
    const [isOpened, setIsOpened] = useState(false);
    const moreUsersCount = userOrBots.length - maxVisible;
    const moreUsersCountText = moreUsersCount > 99 ? "99" : moreUsersCount;

    return (
        <HoverCard.Root open={isOpened} onOpenChange={setIsOpened} {...avatarHoverProps}>
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
            <HoverCard.Content className="z-50 w-auto p-0" align="end" {...avatarHoverProps}>
                <ScrollArea.Root>
                    <Box maxH="52" minW="40" py="1">
                        {userOrBots.slice(maxVisible).map((userOrBot, i) => (
                            <Fragment key={`user-avatar-${userOrBot.uid}-${Utils.String.Token.shortUUID()}`}>
                                {i !== 0 && <Separator className="my-1 h-px bg-muted" />}
                                <UserAvatar.Root
                                    userOrBot={userOrBot}
                                    avatarSize="xs"
                                    listAlign={listAlign}
                                    withNameProps={{
                                        className: "justify-start gap-2 px-3 py-1 hover:bg-accent/70 cursor-pointer",
                                    }}
                                    hoverProps={avatarHoverProps}
                                >
                                    <UserAvatarDefaultList userOrBot={userOrBot} scope={scope} />
                                </UserAvatar.Root>
                            </Fragment>
                        ))}
                    </Box>
                </ScrollArea.Root>
            </HoverCard.Content>
        </HoverCard.Root>
    );
});
