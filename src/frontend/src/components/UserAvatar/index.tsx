/* eslint-disable @/max-len */
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import React, { forwardRef, memo, useState } from "react";
import { Avatar, Card, Flex, HoverCard, IconComponent, Separator } from "@/components/base";
import { IAvatarProps } from "@/components/base/Avatar";
import { User } from "@/core/models";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { cn } from "@/core/utils/ComponentUtils";
import { createNameInitials } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";

interface IBaseUserAvatarProps {
    user: User.Interface;
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

const Root = memo((props: TUserAvatarProps): JSX.Element => {
    const { user, children, listAlign, customTrigger } = props;
    const [isOpened, setIsOpened] = useState(false);
    const initials = createNameInitials(user.firstname, user.lastname);
    const avatarFallbackClassNames = "bg-[--avatar-bg] font-semibold text-[--avatar-text-color]";
    const [bgColor, textColor] = new ColorGenerator(initials).generateAvatarColor();
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

    if (!children || user.id === 0) {
        return <>{trigger}</>;
    }

    return (
        <HoverCard.Root open={isOpened} onOpenChange={setIsOpened}>
            <HoverCard.Trigger asChild>
                <span>{trigger}</span>
            </HoverCard.Trigger>
            <HoverCard.Content className="z-50 w-60 border-none bg-background p-0 xs:w-72" align={listAlign}>
                <Card.Root className="relative">
                    <div className="absolute left-0 top-0 h-24 w-full rounded-t-lg bg-primary/50" />
                    <Card.Header className="relative space-y-0 bg-transparent pb-0">
                        <Avatar.Root className="absolute top-10 border" size="2xl">
                            <Avatar.Image src={user.avatar} />
                            <Avatar.Fallback className={avatarFallbackClassNames} style={styles}>
                                {initials}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <Card.Title className="ml-24 pt-6">
                            {user.firstname} {user.lastname}
                            <Card.Description className="mt-1 text-muted-foreground">@{user.username}</Card.Description>
                        </Card.Title>
                    </Card.Header>
                    <Card.Content className="px-0 pt-8">{children}</Card.Content>
                </Card.Root>
            </HoverCard.Content>
        </HoverCard.Root>
    );
});

export interface IUserAvatarTriggerProps extends Omit<TUserAvatarProps, "listAlign" | "customTrigger"> {
    isOpened: bool;
    setIsOpened: (opened: bool) => void;
}

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
        const initials = createNameInitials(user.firstname, user.lastname);

        const avatarAfterPseudoClassNames = cn(
            "after:transition-all after:block after:z-[-1] after:size-full after:absolute after:top-0 after:left-0 after:rounded-full after:bg-background after:opacity-0",
            children && user.id !== 0 ? "hover:after:z-10 hover:after:bg-accent hover:after:opacity-45 cursor-pointer" : ""
        );

        const [bgColor, textColor] = new ColorGenerator(initials).generateAvatarColor();

        const styles: Record<string, string> = {
            "--avatar-bg": bgColor,
            "--avatar-text-color": textColor,
        };

        const avatarFallbackClassNames = "bg-[--avatar-bg] font-semibold text-[--avatar-text-color]";
        let avatarRootClassName = cn("relative", className);
        let avatarRootOnClick;

        if (children) {
            avatarRootClassName = cn(avatarRootClassName, avatarAfterPseudoClassNames);
            if (user.id !== 0) {
                avatarRootOnClick = () => setIsOpened(!isOpened);
            }
        }

        const avatar = (
            <Avatar.Root size={avatarSize} className={avatarRootClassName} onClick={avatarRootOnClick}>
                <Avatar.Image src={user.avatar} />
                <Avatar.Fallback className={avatarFallbackClassNames} style={styles}>
                    {initials.length ? initials : <IconComponent icon="user" className="h-[80%] w-[80%]" />}
                </Avatar.Fallback>
            </Avatar.Root>
        );

        let avatarWrapper = avatar;

        if (withName) {
            const names = user.id !== 0 ? `${user.firstname} ${user.lastname}` : t("common.Unknown User");
            avatarWrapper = (
                <Flex items="center" className={labelClassName} onClick={avatarRootOnClick}>
                    {!noAvatar && avatar}
                    {customName ? customName : <span className={nameClassName}>{names}</span>}
                </Flex>
            );
        }

        return avatarWrapper;
    }
);

const List = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <div className={cn("w-full", className)} ref={ref} {...props}>
            {children}
        </div>
    );
});

const ListLabel = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <div className={cn("px-5 py-2 text-sm font-semibold", className)} ref={ref} {...props}>
            {children}
        </div>
    );
});

const ListItem = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Flex>>(({ children, className, ...props }, ref) => {
    return (
        <Flex
            items="center"
            px="5"
            py="2"
            textSize="sm"
            className={cn(
                "relative cursor-default select-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
        </Flex>
    );
});

const ListSeparator = forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(
    ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
        return <Separator ref={ref} {...props} />;
    }
);

export default { Root, List, ListLabel, ListItem, ListSeparator };
