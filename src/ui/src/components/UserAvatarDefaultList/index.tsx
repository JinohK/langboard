import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultBotList from "@/components/UserAvatarDefaultList/BotList";
import UserAvatarDefaultUserList from "@/components/UserAvatarDefaultList/UserList";
import { User } from "@/core/models";
import { UserAvatarProvider } from "@/core/providers/UserAvatarProvider";
import { forwardRef, useRef } from "react";
import { useNavigate } from "react-router-dom";

export interface IUserAvatarDefaultListProps extends React.ComponentPropsWithoutRef<typeof UserAvatar.List> {
    user: User.TModel;
    projectUID?: string;
}

const UserAvatarDefaultList = forwardRef<HTMLDivElement, IUserAvatarDefaultListProps>(({ user, projectUID, ...props }, ref) => {
    const userType = user.useField("type");
    const navigateRef = useRef(useNavigate());

    return (
        <UserAvatarProvider navigate={navigateRef.current} user={user} projectUID={projectUID}>
            <UserAvatar.List {...props} ref={ref}>
                {userType === "user" && <UserAvatarDefaultUserList />}
                {userType === "bot" && <UserAvatarDefaultBotList />}
            </UserAvatar.List>
        </UserAvatarProvider>
    );
});

export default UserAvatarDefaultList;
