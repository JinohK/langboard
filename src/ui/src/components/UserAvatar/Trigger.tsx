/* eslint-disable @/max-len */
import { memo } from "react";
import { Avatar, Flex, IconComponent } from "@/components/base";
import { BotModel, User } from "@/core/models";
import { ColorGenerator } from "@/core/utils/ColorUtils";
import { cn } from "@/core/utils/ComponentUtils";
import { createNameInitials } from "@/core/utils/StringUtils";
import { useTranslation } from "react-i18next";
import { tv } from "tailwind-variants";
import { useUserAvatar } from "@/components/UserAvatar/Provider";
import { IUserAvatarProps } from "@/components/UserAvatar/types";
import { isModel } from "@/core/models/ModelRegistry";

export const TriggerVariants = tv(
    {
        base: "relative after:transition-all after:block after:z-[-1] after:size-full after:absolute after:top-0 after:left-0 after:rounded-full after:bg-background after:opacity-0",
        variants: {
            hoverable: {
                true: "hover:after:z-10 hover:after:bg-accent hover:after:opacity-45 cursor-pointer",
            },
        },
    },
    {
        responsiveVariants: true,
    }
);

interface IBaseTriggerProps extends Omit<IUserAvatarProps, "listAlign" | "customTrigger"> {}

const UserAvatarTrigger = memo(({ userOrBot, ...props }: IBaseTriggerProps) => {
    let trigger;
    if (isModel(userOrBot, "User")) {
        trigger = <UserTrigger {...props} user={userOrBot} />;
    } else if (isModel(userOrBot, "BotModel")) {
        trigger = <BotTrigger {...props} bot={userOrBot} />;
    } else {
        trigger = <></>;
    }

    return trigger;
});

function UserTrigger({ user, children, ...props }: Omit<IBaseTriggerProps, "userOrBot"> & { user: User.TModel }) {
    const [t] = useTranslation();
    const userType = user.useField("type");
    const firstname = user.useField("firstname");
    const lastname = user.useField("lastname");
    const avatarUrl = user.useField("avatar");
    const initials = createNameInitials(firstname, lastname);
    const isDeletedUser = user.isDeletedUser(userType);
    const isPresentableUnknownUser = user.isPresentableUnknownUser(userType);

    let names: string;
    if (isDeletedUser) {
        names = t("common.Unknown User");
    } else if (isPresentableUnknownUser) {
        names = firstname;
    } else {
        names = `${firstname} ${lastname}`;
    }

    return (
        <Trigger
            {...props}
            initials={initials}
            avatarUrl={avatarUrl}
            avatarFallback={isPresentableUnknownUser || isDeletedUser ? <IconComponent icon="user" className="h-[80%] w-[80%]" /> : initials}
            hoverable={!!children && !isDeletedUser}
            names={names}
            children={children}
        />
    );
}

function BotTrigger({ bot, children, ...props }: Omit<IBaseTriggerProps, "userOrBot"> & { bot: BotModel.TModel }) {
    const botName = bot.useField("name");
    const avatarUrl = bot.useField("avatar");
    const initials = createNameInitials(botName);

    return (
        <Trigger
            {...props}
            initials={initials}
            avatarUrl={avatarUrl}
            avatarFallback={<IconComponent icon="bot" className="h-[80%] w-[80%]" />}
            hoverable={!!children}
            names={botName}
            children={children}
        />
    );
}

interface ITriggerProps extends Omit<IBaseTriggerProps, "userOrBot"> {
    initials: string;
    avatarUrl?: string;
    avatarFallback: React.ReactNode;
    hoverable: bool;
    names: string;
}

function Trigger({
    avatarSize,
    withNameProps,
    className,
    initials,
    avatarUrl,
    avatarFallback,
    names,
    hoverable,
    children,
}: ITriggerProps): React.ReactNode {
    const { isOpened, setIsOpened } = useUserAvatar();

    const [bgColor, textColor] = new ColorGenerator(initials).generateAvatarColor();

    const styles: Record<string, string> = {
        "--avatar-bg": bgColor,
        "--avatar-text-color": textColor,
    };

    let avatarRootClassName = className;
    let avatarRootOnClick;

    if (children) {
        avatarRootClassName = cn(avatarRootClassName, TriggerVariants({ hoverable }));
        avatarRootOnClick = () => setIsOpened(!isOpened);
    }

    const avatar = (
        <Avatar.Root size={avatarSize} className={avatarRootClassName} onClick={avatarRootOnClick}>
            <Avatar.Image src={avatarUrl} />
            <Avatar.Fallback className="bg-[--avatar-bg] font-semibold text-[--avatar-text-color]" style={styles}>
                {avatarFallback}
            </Avatar.Fallback>
        </Avatar.Root>
    );

    let avatarWrapper = avatar;

    if (withNameProps) {
        withNameProps = {
            className: "gap-2",
            nameClassName: "text-sm font-semibold text-foreground",
            noAvatar: false,
            ...withNameProps,
        };
        avatarWrapper = (
            <Flex items="center" style={styles} className={withNameProps.className} onClick={avatarRootOnClick}>
                {!withNameProps.noAvatar && avatar}
                {withNameProps.customName ? withNameProps.customName : <span className={withNameProps.nameClassName}>{names}</span>}
            </Flex>
        );
    }

    return avatarWrapper;
}

export default UserAvatarTrigger;
