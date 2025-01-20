import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, User } from "@/core/models";

export interface IBoardAssignedUsersUpdatedRawResponse {
    assigned_members: User.Interface[];
    invited_members: User.Interface[];
    invitation_uid?: string;
}

export interface IBoardAssignedUsersUpdatedResponse {
    assigned_member_uids: string[];
}

export interface IUseBoardAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardAssignedUsersUpdatedResponse> {
    projectUID: string;
}

const useBoardAssignedUsersUpdatedHandlers = ({ callback, projectUID }: IUseBoardAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler<IBoardAssignedUsersUpdatedResponse, IBoardAssignedUsersUpdatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-assigned-users-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const model = Project.Model.getModel(projectUID);
                if (model) {
                    model.members = [...data.assigned_members];
                    model.invited_members = [...data.invited_members];
                }

                if (data.invitation_uid) {
                    User.Model.deleteModel(data.invitation_uid);
                }
                return {
                    assigned_member_uids: data.assigned_members.map((member) => member.uid),
                };
            },
        },
    });
};

export default useBoardAssignedUsersUpdatedHandlers;
