/* eslint-disable @/max-len */
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import React, { forwardRef, memo, useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Box, Card, Flex, IconComponent, Popover, Separator } from "@/components/base";
import { IAvatarProps } from "@/components/base/Avatar";
import { User } from "@/core/models";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { cn } from "@/core/utils/ComponentUtils";
import { createNameInitials } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";
import TypeUtils from "@/core/utils/TypeUtils";

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

export const getAvatarHoverCardAttrs = (user: User.TModel): Record<string, string> => {
    return {
        "data-avatar-user": user.uid,
    };
};

const Root = memo(({ ...props }: TUserAvatarProps): JSX.Element => {
    const { user, children, listAlign, customTrigger } = props;
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
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const changeOpenedByHover = useCallback(() => {
        if (isOpened) {
            return;
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setIsOpened(true);
            if (!TypeUtils.isNullOrUndefined(hoverTimeoutRef.current)) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        }, 500);
    }, [isOpened]);
    const styles: Record<string, string> = {
        "--avatar-bg": bgColor,
        "--avatar-text-color": textColor,
    };

    useEffect(() => {
        if (!isOpened) {
            return;
        }

        let outTimeout: NodeJS.Timeout;
        const mouseOutHandler = (e: MouseEvent) => {
            const elementInScope = (e.target as Element)?.closest?.("[data-avatar-user]");
            const attrValue = elementInScope?.getAttribute("data-avatar-user");
            if (e.target !== document.documentElement && (!elementInScope || attrValue !== user.uid)) {
                if (!outTimeout) {
                    outTimeout = setTimeout(() => {
                        setIsOpened(() => false);
                        if (!TypeUtils.isNullOrUndefined(outTimeout)) {
                            clearTimeout(outTimeout);
                            outTimeout = undefined!;
                        }
                    }, 500);
                }
                return;
            }

            if (outTimeout) {
                clearTimeout(outTimeout);
                outTimeout = undefined!;
            }
        };

        window.addEventListener("mouseover", mouseOutHandler);
        return () => {
            window.removeEventListener("mouseover", mouseOutHandler);
            if (!TypeUtils.isNullOrUndefined(outTimeout)) {
                clearTimeout(outTimeout);
                outTimeout = undefined!;
            }
        };
    }, [isOpened]);

    let trigger;
    if (customTrigger) {
        trigger = customTrigger;
    } else {
        trigger = <Trigger {...props} isOpened={isOpened} setIsOpened={setIsOpened} />;
    }

    if (!children || isDeletedUser) {
        return <>{trigger}</>;
    }

    return (
        <Popover.Root open={isOpened} onOpenChange={setIsOpened} {...getAvatarHoverCardAttrs(user)}>
            <Popover.Trigger
                onPointerEnter={changeOpenedByHover}
                onPointerLeave={() => {
                    if (!TypeUtils.isNullOrUndefined(hoverTimeoutRef.current)) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                    }
                }}
                asChild
            >
                <span>{trigger}</span>
            </Popover.Trigger>
            <Popover.Content className="z-[100] w-60 border-none bg-background p-0 xs:w-72" align={listAlign} {...getAvatarHoverCardAttrs(user)}>
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
