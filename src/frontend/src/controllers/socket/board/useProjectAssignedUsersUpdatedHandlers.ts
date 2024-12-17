import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { User } from "@/core/models";

export interface IProjectAssignedUsersUpdateRequest {}

export interface IProjectAssignedUsersUpdatedResponse {
    assigned_users: User.Interface[];
    invited_users: User.Interface[];
}

export interface IUseProjectAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<IProjectAssignedUsersUpdatedResponse> {
    projectUID: string;
}

const useProjectAssignedUsersUpdatedHandlers = ({ socket, callback, projectUID }: IUseProjectAssignedUsersUpdatedHandlersProps) => {
    return useSocketHandler<IProjectAssignedUsersUpdateRequest, IProjectAssignedUsersUpdatedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `project-assigned-users-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (response) => {
                User.transformFromApi(response.assigned_users);
                User.transformFromApi(response.invited_users);
                return response;
            },
        },
    });
};

export default useProjectAssignedUsersUpdatedHandlers;
