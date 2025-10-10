import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultBotList from "@/components/UserAvatarDefaultList/BotList";
import { IUserAvatarDefaultListProviderProps, UserAvatarDefaultListProvider } from "@/components/UserAvatarDefaultList/Provider";
import UserAvatarDefaultUserList from "@/components/UserAvatarDefaultList/UserList";
import UserLikeComponent from "@/components/UserLikeComponent";
import { TUserLikeModel } from "@/core/models/ModelRegistry";
import { forwardRef } from "react";

export interface IUserAvatarDefaultListProps extends React.ComponentPropsWithoutRef<typeof UserAvatar.List> {
    userOrBot: TUserLikeModel;
    scope?: IUserAvatarDefaultListProviderProps["scope"];
}

const UserAvatarDefaultList = forwardRef<HTMLDivElement, IUserAvatarDefaultListProps>(({ userOrBot, scope, ...props }, ref) => {
    return (
        <UserAvatarDefaultListProvider userOrBot={userOrBot} scope={scope}>
            <UserAvatar.List {...props} ref={ref}>
                <UserLikeComponent userOrBot={userOrBot} userComp={UserAvatarDefaultUserList} botComp={UserAvatarDefaultBotList} />
            </UserAvatar.List>
        </UserAvatarDefaultListProvider>
    );
});

export default UserAvatarDefaultList;
