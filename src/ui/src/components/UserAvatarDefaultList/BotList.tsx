import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultBotToggleAction from "@/components/UserAvatarDefaultList/actions/BotToggleBotAction";
import UserAvatarDefaultUnassignAction from "@/components/UserAvatarDefaultList/actions/UnassignAction";
import UserAvatarDefaultViewActivitiesAction from "@/components/UserAvatarDefaultList/actions/ViewActivitiesAction";
import { useUserAvatarDefaultList } from "@/components/UserAvatarDefaultList/Provider";
import { BotModel, Project } from "@/core/models";
import { Utils } from "@langboard/core/utils";

interface IUserAvatarDefaultUserListProps {
    bot: BotModel.TModel;
}

function UserAvatarDefaultBotList({ bot }: IUserAvatarDefaultUserListProps): JSX.Element {
    const { project, currentUser, hasRoleAction, setIsAssignee, isBotDisabled } = useUserAvatarDefaultList();

    return (
        <>
            {project && (hasRoleAction(Project.ERoleAction.Update) || currentUser?.is_admin) && Utils.Type.isBool(isBotDisabled) && !!bot && (
                <UserAvatarDefaultBotToggleAction bot={bot} project={project} />
            )}
            {project && (
                <>
                    <UserAvatarDefaultViewActivitiesAction project={project} currentUser={currentUser} />
                    <UserAvatar.ListSeparator />
                </>
            )}
            {project && (hasRoleAction(Project.ERoleAction.Update) || currentUser?.is_admin) && (
                <>
                    <UserAvatarDefaultUnassignAction project={project} setIsAssignee={setIsAssignee} />
                    <UserAvatar.ListSeparator />
                </>
            )}
        </>
    );
}

export default UserAvatarDefaultBotList;
