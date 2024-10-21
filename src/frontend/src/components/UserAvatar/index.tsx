/* eslint-disable @/max-len */
import { Avatar, Card, HoverCard, Separator } from "@/components/base";
import { IAvatarProps } from "@/components/base/Avatar";
import { API_URL } from "@/constants";
import { IUser } from "@/core/types";
import { cn } from "@/core/utils/ComponentUtils";
import { createNameInitials } from "@/core/utils/StringUtils";
import { forwardRef, useState } from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { generateRandomColor } from "@/core/utils/ColorUtils";

export interface IUserAvatarProps {
    user: IUser;
    children: React.ReactNode;
    align?: "center" | "start" | "end";
    avatarSize?: IAvatarProps["size"];
}

function Root({ user, children, align, avatarSize }: IUserAvatarProps): JSX.Element {
    const [isOpened, setIsOpened] = useState(false);
    const initials = createNameInitials(user.firstname, user.lastname);

    const avatarAfterPseudoClassNames = cn(
        "after:transition-all after:block after:z-[-1] after:h-full after:w-full after:absolute after:top-0 after:left-0 after:rounded-full after:bg-background after:opacity-0",
        "hover:after:z-10 hover:after:bg-accent hover:after:opacity-45"
    );

    const [bgColor, textColor] = generateRandomColor(initials);

    const styles: Record<string, string> = {
        "--avatar-bg": bgColor,
        "--avatar-text-color": textColor,
    };

    const avatarClassNames = "bg-[--avatar-bg] font-semibold text-[--avatar-text-color]";

    return (
        <HoverCard.Root open={isOpened} onOpenChange={setIsOpened}>
            <HoverCard.Trigger asChild>
                <Avatar.Root
                    size={avatarSize}
                    className={cn("relative cursor-pointer", avatarAfterPseudoClassNames)}
                    onClick={() => setIsOpened(!isOpened)}
                >
                    <Avatar.Image src={`${API_URL}${user.avatar}`} />
                    <Avatar.Fallback className={avatarClassNames} style={styles}>
                        {initials}
                    </Avatar.Fallback>
                </Avatar.Root>
            </HoverCard.Trigger>
            <HoverCard.Content className="w-60 border-none bg-background p-0 xs:w-72" align={align}>
                <Card.Root className="relative">
                    <div className="absolute left-0 top-0 h-24 w-full rounded-t-lg bg-primary/50" />
                    <Card.Header className="relative space-y-0 bg-transparent pb-0">
                        <Avatar.Root className="absolute top-10 border" size="2xl">
                            <Avatar.Image src={`${API_URL}${user.avatar}`} />
                            <Avatar.Fallback className={avatarClassNames} style={styles}>
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
}

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

const ListItem = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(({ children, className, ...props }, ref) => {
    return (
        <div
            className={cn(
                "relative flex cursor-default select-none items-center px-5 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
        </div>
    );
});

const ListSeparator = forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(
    ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
        return <Separator ref={ref} {...props} />;
    }
);

export default { Root, List, ListLabel, ListItem, ListSeparator };
