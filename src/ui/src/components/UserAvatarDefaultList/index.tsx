import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultBotList from "@/components/UserAvatarDefaultList/BotList";
import { UserAvatarDefaultListProvider } from "@/components/UserAvatarDefaultList/Provider";
import UserAvatarDefaultUserList from "@/components/UserAvatarDefaultList/UserList";
import UserLikeComponent from "@/components/UserLikeComponent";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { forwardRef } from "react";

export interface IUserAvatarDefaultListProps extends React.ComponentPropsWithoutRef<typeof UserAvatar.List> {
    userOrBot: TUserLikeModel;
    projectUID?: string;
}

const UserAvatarDefaultList = forwardRef<HTMLDivElement, IUserAvatarDefaultListProps>(({ userOrBot, projectUID, ...props }, ref) => {
    return (
        <UserAvatarDefaultListProvider userOrBot={userOrBot} projectUID={projectUID}>
            <UserAvatar.List {...props} ref={ref}>
                <UserLikeComponent userOrBot={userOrBot} userComp={UserAvatarDefaultUserList} botComp={UserAvatarDefaultBotList} />
            </UserAvatar.List>
        </UserAvatarDefaultListProvider>
    );
});

export default UserAvatarDefaultList;
