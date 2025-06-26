import { IAvatarProps } from "@/components/base/Avatar";
import { TUserLikeModel } from "@/core/models/ModelRegistry";

export interface IUserAvatarProps {
    userOrBot: TUserLikeModel;
    children?: React.ReactNode;
    listAlign?: "center" | "start" | "end";
    avatarSize?: IAvatarProps["size"];
    className?: string;
    customTrigger?: React.ReactNode;
    withNameProps?: {
        className?: string;
        nameClassName?: string;
        noAvatar?: bool;
        customName?: React.ReactNode;
    };
    hoverProps?: Record<string, string>;
    onlyAvatar?: bool;
}
