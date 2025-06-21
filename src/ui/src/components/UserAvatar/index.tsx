/* eslint-disable @/max-len */
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import React, { forwardRef, memo, useState } from "react";
import { Avatar, Box, Card, Flex, IconComponent, Popover, Separator } from "@/components/base";
import { IAvatarProps } from "@/components/base/Avatar";
import { User } from "@/core/models";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { cn } from "@/core/utils/ComponentUtils";
import { createNameInitials } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";
import useHoverEffect from "@/core/hooks/useHoverEffect";

interface IBaseUserAvatarProps {
    user: User.TModel;
    children?: React.ReactNode;
    listAlign?: "center" | "start" | "end";
    avatarSize?: IAvatarProps["size"];
    className?: string;
    withName?: bool;
    nameClassName?: string;
    labelClassName?: string;
    noAvatar?: bool;
    customName?: React.ReactNode;
    customTrigger?: React.ReactNode;
    hoverProps?: Record<string, string>;
    onlyAvatar?: bool;
}

interface IUserAvatarPropsWithName extends IBaseUserAvatarProps {
    withName: true;
    nameClassName?: string;
    labelClassName?: string;
    noAvatar?: bool;
    customName?: React.ReactNode;
    customTrigger?: never;
}

interface IUserAvatarPropsWithoutName extends IBaseUserAvatarProps {
    withName?: false;
    nameClassName?: never;
    labelClassName?: never;
    noAvatar?: never;
    customName?: never;
    customTrigger?: never;
}

interface IUserAvatarPropsWithCustomTrigger extends IBaseUserAvatarProps {
    withName?: never;
    nameClassName?: never;
    labelClassName?: never;
    noAvatar?: never;
    customName?: never;
    customTrigger: React.ReactNode;
}

export type TUserAvatarProps = IUserAvatarPropsWithName | IUserAvatarPropsWithoutName | IUserAvatarPropsWithCustomTrigger;

const HOVER_DELAY = 500;
const HOVER_USER_UID_ATTR = "data-avatar-user";
export const getAvatarHoverCardAttrs = (user: User.TModel): Record<string, string> => {
    return {
        [HOVER_USER_UID_ATTR]: user.uid,
    };
};

const Root = memo((props: TUserAvatarProps): JSX.Element => {
    const { user, children, listAlign, customTrigger, hoverProps = {}, onlyAvatar } = props;
    const [isOpened, setIsOpened] = useState(false);
    const userType = user.useField("type");
    const firstname = user.useField("firstname");
    const lastname = user.useField("lastname");
    const username = user.useField("username");
    const userAvatar = user.useField("avatar");
    const initials = createNameInitials(firstname, lastname);
    const avatarFallbackClassNames = "bg-[--avatar-bg] font-semibold text-[--avatar-text-color]";
    const [bgColor, textColor] = new ColorGenerator(initials).generateAvatarColor();
    const isDeletedUser = user.isDeletedUser(userType);
    const isPresentableUnknownUser = user.isPresentableUnknownUser(userType);
    const { onPointerEnter, onPointerLeave } = useHoverEffect({
        isOpened,
        setIsOpened,
        scopeAttr: HOVER_USER_UID_ATTR,
        expectedScopeValue: user.uid,
        delay: HOVER_DELAY,
    });

    const styles: Record<string, string> = {
        "--avatar-bg": bgColor,
        "--avatar-text-color": textColor,
    };

    let trigger;
    if (customTrigger) {
        trigger = customTrigger;
    } else {
        trigger = <Trigger {...props} isOpened={isOpened} setIsOpened={setIsOpened} />;
    }

    if (onlyAvatar || !children || isDeletedUser) {
        return <>{trigger}</>;
    }

    const hoverAttrs = {
        ...getAvatarHoverCardAttrs(user),
        ...hoverProps,
    };

    return (
        <Popover.Root open={isOpened} onOpenChange={setIsOpened} {...hoverAttrs}>
            <Popover.Trigger onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} asChild>
                <span>{trigger}</span>
            </Popover.Trigger>
            <Popover.Content className="z-[100] w-60 border-none bg-background p-0 xs:w-72" align={listAlign} {...hoverAttrs}>
                <Card.Root className="relative">
                    <Box position="absolute" left="0" top="0" h="24" w="full" className="rounded-t-lg bg-primary/50" />
                    <Card.Header className="relative space-y-0 bg-transparent pb-0">
                        <Avatar.Root className="absolute top-10 border" size="2xl">
                            <Avatar.Image src={userAvatar} />
                            <Avatar.Fallback className={avatarFallbackClassNames} style={styles}>
                                {user.isBot(userType) ? (
                                    <IconComponent icon="bot" className="h-[80%] w-[80%]" />
                                ) : isPresentableUnknownUser ? (
                                    <IconComponent icon="user" className="h-[80%] w-[80%]" />
                                ) : (
                                    initials
                                )}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <Card.Title className={cn("ml-24 pt-6", !user.isBot() && isPresentableUnknownUser ? "pt-10" : "")}>
                            {firstname} {lastname}
                            {user.isBot(userType) || !isPresentableUnknownUser ? (
                                <Card.Description className="mt-1 text-muted-foreground">@{username}</Card.Description>
                            ) : null}
                        </Card.Title>
                    </Card.Header>
                    <Card.Content className="px-0 pt-8">{!isPresentableUnknownUser && children}</Card.Content>
                </Card.Root>
            </Popover.Content>
        </Popover.Root>
    );
});

export interface IUserAvatarTriggerProps extends Omit<TUserAvatarProps, "listAlign" | "customTrigger"> {
    isOpened: bool;
    setIsOpened: (opened: bool) => void;
}

const TriggerVariants = tv({
    base: "relative after:transition-all after:block after:z-[-1] after:size-full after:absolute after:top-0 after:left-0 after:rounded-full after:bg-background after:opacity-0",
    variants: {
        hoverable: {
            true: "hover:after:z-10 hover:after:bg-accent hover:after:opacity-45 cursor-pointer",
        },
    },
});

const Trigger = memo(
    ({
        user,
        children,
        avatarSize,
        className,
        withName = false,
        nameClassName,
        labelClassName,
        noAvatar,
        customName,
        isOpened,
        setIsOpened,
    }: IUserAvatarTriggerProps) => {
        const [t] = useTranslation();
        const userType = user.useField("type");
        const firstname = user.useField("firstname");
        const lastname = user.useField("lastname");
        const userAvatar = user.useField("avatar");
        const initials = createNameInitials(firstname, lastname);
        const isDeletedUser = user.isDeletedUser(userType);
        const isPresentableUnknownUser = user.isPresentableUnknownUser(userType);

        const [bgColor, textColor] = new ColorGenerator(initials).generateAvatarColor();

        const styles: Record<string, string> = {
            "--avatar-bg": bgColor,
            "--avatar-text-color": textColor,
        };

        const avatarFallbackClassNames = "bg-[--avatar-bg] font-semibold text-[--avatar-text-color]";
        let avatarRootClassName = className;
        let avatarRootOnClick;

        if (children) {
            avatarRootClassName = cn(avatarRootClassName, TriggerVariants({ hoverable: !!children && !isDeletedUser }));
            if (!isDeletedUser && !isPresentableUnknownUser) {
                avatarRootOnClick = () => setIsOpened(!isOpened);
            }
        }

        const avatar = (
            <Avatar.Root size={avatarSize} className={avatarRootClassName} onClick={avatarRootOnClick}>
                <Avatar.Image src={userAvatar} />
                <Avatar.Fallback className={avatarFallbackClassNames} style={styles}>
                    {user.isBot(userType) ? (
                        <IconComponent icon="bot" className="h-[80%] w-[80%]" />
                    ) : isPresentableUnknownUser || isDeletedUser ? (
                        <IconComponent icon="user" className="h-[80%] w-[80%]" />
                    ) : (
                        initials
                    )}
                </Avatar.Fallback>
            </Avatar.Root>
        );

        let avatarWrapper = avatar;

        if (withName) {
            let names: string;
            if (isDeletedUser) {
                names = t("common.Unknown User");
            } else if (isPresentableUnknownUser) {
                names = firstname;
            } else {
                names = `${firstname} ${lastname}`;
            }

            avatarWrapper = (
                <Flex items="center" style={styles} className={labelClassName} onClick={avatarRootOnClick}>
                    {!noAvatar && avatar}
                    {customName ? customName : <span className={nameClassName}>{names}</span>}
                </Flex>
            );
        }

        return avatarWrapper;
    }
);

const List = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <Box w="full" mt="2" className={className} ref={ref} {...props}>
            {children}
        </Box>
    );
});

const ListLabel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <Box px="5" py="2" textSize="sm" weight="semibold" className={className} ref={ref} {...props}>
            {children}
        </Box>
    );
});

const ListItem = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Flex>>(({ children, className, ...props }, ref) => {
    return (
        <Flex
            items="center"
            px="5"
            py="2"
            textSize="sm"
            position="relative"
            cursor="default"
            className={cn(
                "cursor-pointer select-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
        </Flex>
    );
});

const ListSeparator = forwardRef<React.ComponentRef<typeof SeparatorPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(
    ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
        return <Separator ref={ref} {...props} />;
    }
);

export default { Root, List, ListLabel, ListItem, ListSeparator, TriggerVariants };
