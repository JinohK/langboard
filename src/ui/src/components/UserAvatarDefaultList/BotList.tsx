import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultViewActivitiesAction from "@/components/UserAvatarDefaultList/actions/ViewActivitiesAction";
import { useUserAvatarDefaultList } from "@/components/UserAvatarDefaultList/Provider";

function UserAvatarDefaultBotList(): JSX.Element {
    const { project, currentUser } = useUserAvatarDefaultList();

    return (
        <>
            {project && (
                <>
                    <UserAvatarDefaultViewActivitiesAction project={project} currentUser={currentUser} />
                    <UserAvatar.ListSeparator />
                </>
            )}
        </>
    );
}

export default UserAvatarDefaultBotList;
