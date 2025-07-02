import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, User } from "@/core/models";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardProjectAssignedUsersUpdatedRawResponse {
    assigned_users: User.Interface[];
}

export interface IUseDashboardProjectAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    userUID: string;
}

const useDashboardProjectAssignedUsersUpdatedHandlers = ({
    callback,
    projectUID,
    userUID,
}: IUseDashboardProjectAssignedUsersUpdatedHandlersProps) => {
    const socket = useSocketOutsideProvider();

    return useSocketHandler<{}, IDashboardProjectAssignedUsersUpdatedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-project-assigned-users-updated-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                if (!data.assigned_users.some((user) => user.uid === userUID)) {
                    Project.Model.deleteModel(projectUID);
                    socket.unsubscribe(ESocketTopic.Dashboard, [projectUID]);
                }
                return {};
            },
        },
    });
};

export default useDashboardProjectAssignedUsersUpdatedHandlers;
