import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { AuthUser, Project, ProjectCard } from "@/core/models";

export interface IUserProjectRolesUpdatedRawResponse {
    project_uid: string;
    roles: Project.TRoleActions[];
}

export interface IUseUserProjectRolesUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    currentUser: AuthUser.TModel;
}

const useUserProjectRolesUpdatedHandlers = ({ callback, currentUser }: IUseUserProjectRolesUpdatedHandlersProps) => {
    return useSocketHandler<{}, IUserProjectRolesUpdatedRawResponse>({
        topic: ESocketTopic.UserPrivate,
        topicId: currentUser.uid,
        eventKey: `user-project-roles-updated-${currentUser.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.USER.PROJECT_ROLES_UPDATED,
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(data.project_uid);
                if (project) {
                    if (project.member_roles) {
                        const memberRoles = { ...project.member_roles };
                        memberRoles[currentUser.uid] = data.roles;
                        project.member_roles = memberRoles;
                    }
                    project.current_auth_role_actions = data.roles;
                }

                const cards = ProjectCard.Model.getModels((model) => model.project_uid === data.project_uid && !!model.current_auth_role_actions);
                for (let i = 0; i < cards.length; ++i) {
                    const card = cards[i];
                    card.current_auth_role_actions = data.roles;
                }

                return {};
            },
        },
    });
};

export default useUserProjectRolesUpdatedHandlers;
