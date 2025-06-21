import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultBotToggleAction from "@/components/UserAvatarDefaultList/actions/BotToggleBotAction";
import UserAvatarDefaultUnassignAction from "@/components/UserAvatarDefaultList/actions/UnassignAction";
import UserAvatarDefaultViewActivitiesAction from "@/components/UserAvatarDefaultList/actions/ViewActivitiesAction";
import { BotModel, Project } from "@/core/models";
import { useUserAvatar } from "@/core/providers/UserAvatarProvider";
import TypeUtils from "@/core/utils/TypeUtils";

function UserAvatarDefaultBotList(): JSX.Element {
    const { user, project, currentUser, hasRoleAction, setIsAssignee, isBotDisabled } = useUserAvatar();
    const bots = BotModel.Model.useModels((model) => model.uid === user.uid);
    const bot = bots[0];

    return (
        <>
            {project && (hasRoleAction(Project.ERoleAction.Update) || currentUser?.is_admin) && TypeUtils.isBool(isBotDisabled) && !!bot && (
                <UserAvatarDefaultBotToggleAction bot={bot} project={project} />
            )}
            {project && (
                <>
                    <UserAvatarDefaultViewActivitiesAction user={user} project={project} currentUser={currentUser} />
                    <UserAvatar.ListSeparator />
                </>
            )}
            {project && (hasRoleAction(Project.ERoleAction.Update) || currentUser?.is_admin) && (
                <>
                    <UserAvatarDefaultUnassignAction user={user} project={project} setIsAssignee={setIsAssignee} />
                    <UserAvatar.ListSeparator />
                </>
            )}
        </>
    );
}

export default UserAvatarDefaultBotList;
