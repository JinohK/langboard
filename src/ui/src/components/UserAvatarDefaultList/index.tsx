import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultBotList from "@/components/UserAvatarDefaultList/BotList";
import { UserAvatarDefaultListProvider } from "@/components/UserAvatarDefaultList/Provider";
import UserAvatarDefaultUserList from "@/components/UserAvatarDefaultList/UserList";
import { isModel, TUserLikeModel } from "@/core/models/ModelRegistry";
import { forwardRef } from "react";

export interface IUserAvatarDefaultListProps extends React.ComponentPropsWithoutRef<typeof UserAvatar.List> {
    userOrBot: TUserLikeModel;
    projectUID?: string;
}

const UserAvatarDefaultList = forwardRef<HTMLDivElement, IUserAvatarDefaultListProps>(({ userOrBot, projectUID, ...props }, ref) => {
    return (
        <UserAvatarDefaultListProvider userOrBot={userOrBot} projectUID={projectUID}>
            <UserAvatar.List {...props} ref={ref}>
                <DefaultList userOrBot={userOrBot} />
            </UserAvatar.List>
        </UserAvatarDefaultListProvider>
    );
});

function DefaultList({ userOrBot }: IUserAvatarDefaultListProps): JSX.Element {
    let content;
    if (isModel(userOrBot, "User")) {
        content = <UserAvatarDefaultUserList user={userOrBot} />;
    } else if (isModel(userOrBot, "BotModel")) {
        content = <UserAvatarDefaultBotList bot={userOrBot} />;
    } else {
        content = <></>;
    }

    return content;
}

export default UserAvatarDefaultList;
