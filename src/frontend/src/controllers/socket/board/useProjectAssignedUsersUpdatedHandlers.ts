import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, User } from "@/core/models";

export interface IProjectAssignedUsersUpdatedRawResponse {
    assigned_members: User.Interface[];
    invited_members: User.Interface[];
    invitation_uid?: string;
}

export interface IUseProjectAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectAssignedUsersUpdatedHandlers = ({ callback, projectUID }: IUseProjectAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler<{}, IProjectAssignedUsersUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `project-assigned-users-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const model = Project.Model.getModel(projectUID);
                if (model) {
                    model.members = data.assigned_members;
                    model.invited_members = data.invited_members;
                }

                if (data.invitation_uid) {
                    User.Model.deleteModel(data.invitation_uid);
                }
                return {};
            },
        },
    });
};

export default useProjectAssignedUsersUpdatedHandlers;
