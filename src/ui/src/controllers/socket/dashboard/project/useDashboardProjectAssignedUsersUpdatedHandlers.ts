import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, User } from "@/core/models";
import { useSocketOutsideProvider } from "@/core/providers/SocketProvider";
import { getAuthStore } from "@/core/stores/AuthStore";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardProjectAssignedUsersUpdatedRawResponse {
    assigned_users: User.Interface[];
}

export interface IUseDashboardProjectAssignedUsersUpdatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardProjectAssignedUsersUpdatedHandlers = ({ callback, projectUID }: IUseDashboardProjectAssignedUsersUpdatedHandlersProps) => {
    const socket = useSocketOutsideProvider();

    return useSocketHandler<{}, IDashboardProjectAssignedUsersUpdatedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-project-assigned-users-updated-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.DASHBOARD.PROJECT.ASSIGNED_USERS_UPDATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const currentUser = getAuthStore().currentUser;
                if (!currentUser) {
                    return {};
                }

                if (!data.assigned_users.some((user) => user.uid === currentUser.uid)) {
                    Project.Model.deleteModel(projectUID);
                    socket.unsubscribe(ESocketTopic.Dashboard, [projectUID]);
                }
                return {};
            },
        },
    });
};

export default useDashboardProjectAssignedUsersUpdatedHandlers;
