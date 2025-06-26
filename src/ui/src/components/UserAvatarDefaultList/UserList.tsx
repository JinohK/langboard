import { Popover } from "@/components/base";
import NotificationSetting from "@/components/NotificationSetting";
import UserAvatar from "@/components/UserAvatar";
import UserAvatarDefaultUserCreateAssignCardAction from "@/components/UserAvatarDefaultList/actions/UserCreateAssignCardAction";
import UserAvatarDefaultUnassignAction from "@/components/UserAvatarDefaultList/actions/UnassignAction";
import UserAvatarDefaultViewActivitiesAction from "@/components/UserAvatarDefaultList/actions/ViewActivitiesAction";
import useSearchFilters from "@/core/hooks/useSearchFilters";
import { Project, User } from "@/core/models";
import { BOARD_FILTER_KEYS, IFilterMap } from "@/core/providers/BoardProvider";
import { ROUTES } from "@/core/routing/constants";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUserAvatarDefaultList } from "@/components/UserAvatarDefaultList/Provider";
import { useUserAvatar } from "@/components/UserAvatar/Provider";

interface IUserAvatarDefaultUserListProps {
    user: User.TModel;
}

function UserAvatarDefaultUserList({ user }: IUserAvatarDefaultUserListProps): JSX.Element {
    const { getAvatarHoverCardAttrs } = useUserAvatar();
    const { project, currentUser, hasRoleAction, isAssignee, setIsAssignee } = useUserAvatarDefaultList();
    const [t] = useTranslation();
    const {
        filters,
        toString: filtersToString,
        unique: uniqueFilters,
        forceUpdate: forceUpdateFilters,
    } = useSearchFilters<IFilterMap>({ filterKeys: BOARD_FILTER_KEYS, searchKey: "filters" }, [user, project]);
    const navigateRef = useRef(useNavigate());

    return (
        <>
            {project && isAssignee && (hasRoleAction(Project.ERoleAction.CardWrite) || currentUser?.is_admin) && (
                <>
                    <UserAvatarDefaultUserCreateAssignCardAction user={user} project={project} />
                    <UserAvatar.ListSeparator />
                </>
            )}
            {project && (
                <>
                    <UserAvatar.ListItem
                        onClick={() => {
                            if (!filters.members) {
                                filters.members = [];
                            }

                            filters.members.push(user.email);

                            uniqueFilters();
                            const newFiltersString = filtersToString();
                            navigateRef.current({
                                pathname: ROUTES.BOARD.MAIN(project.uid),
                                search: `?filters=${newFiltersString}`,
                            });
                            forceUpdateFilters();
                        }}
                    >
                        {t("common.avatarActions.View cards")}
                    </UserAvatar.ListItem>
                    <UserAvatar.ListSeparator />
                </>
            )}
            {project && (
                <>
                    <UserAvatarDefaultViewActivitiesAction project={project} currentUser={currentUser} />
                    <UserAvatar.ListSeparator />
                </>
            )}
            {project && currentUser && currentUser.uid === user.uid && hasRoleAction(Project.ERoleAction.Read) && (
                <>
                    <Popover.Root modal={false}>
                        <Popover.Trigger asChild>
                            <UserAvatar.ListItem>{t("common.avatarActions.Set notifications")}</UserAvatar.ListItem>
                        </Popover.Trigger>
                        <Popover.Content className="z-[999999]" {...getAvatarHoverCardAttrs()}>
                            <NotificationSetting.SpecificScopedPopover
                                type="project"
                                currentUser={currentUser}
                                form={{
                                    project_uid: project.uid,
                                }}
                                specificUID={project.uid}
                                onlyFlex
                            />
                        </Popover.Content>
                    </Popover.Root>
                    <UserAvatar.ListSeparator />
                </>
            )}
            {project && currentUser?.uid !== user.uid && isAssignee && (hasRoleAction(Project.ERoleAction.Update) || currentUser?.is_admin) && (
                <>
                    <UserAvatarDefaultUnassignAction project={project} setIsAssignee={setIsAssignee} />
                    <UserAvatar.ListSeparator />
                </>
            )}
        </>
    );
}

export default UserAvatarDefaultUserList;
