import { Button } from "@/components/base";
import { AvatarVariants } from "@/components/base/Avatar";
import UserAvatar, { IUserAvatarProps } from "@/components/UserAvatar";
import { User } from "@/core/models";
import { cn } from "@/core/utils/ComponentUtils";
import { forwardRef } from "react";

interface IUserAvatarListProps extends React.HTMLAttributes<HTMLDivElement> {
    users: User.Interface[];
    maxVisible: number;
    size?: IUserAvatarProps["avatarSize"];
    spacing?: "1" | "2" | "3" | "4" | "5";
    listAlign?: IUserAvatarProps["listAlign"];
}

const UserAvatarList = forwardRef<HTMLDivElement, IUserAvatarListProps>(
    ({ maxVisible, className, users, size = "default", spacing = "2", listAlign, ...props }: IUserAvatarListProps, ref) => {
        const moreUsersCount = users.length - maxVisible;
        const spacingMap = {
            1: "-space-x-5",
            2: "-space-x-4",
            3: "-space-x-3",
            4: "-space-x-2",
            5: "-space-x-1",
        };
        return (
            <div className={cn("relative flex rtl:space-x-reverse", spacingMap[spacing], className)} ref={ref} {...props}>
                {users.slice(0, maxVisible).map((user, index) => (
                    <UserAvatar.Root key={index} user={user} avatarSize={size} listAlign={listAlign} className="hover:z-50">
                        <UserAvatar.List>
                            <UserAvatar.ListLabel>{user.firstname}</UserAvatar.ListLabel>
                        </UserAvatar.List>
                    </UserAvatar.Root>
                ))}
                {moreUsersCount > 0 && (
                    <Button variant="secondary" className={cn(AvatarVariants({ size }), "z-10 m-0 select-none border-none p-0")}>
                        +{moreUsersCount > 99 ? "99" : moreUsersCount}
                    </Button>
                )}
            </div>
        );
    }
);

export default UserAvatarList;
