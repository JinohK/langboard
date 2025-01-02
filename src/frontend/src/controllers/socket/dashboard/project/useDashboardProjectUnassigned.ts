import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IUseDashboardProjectUnassignedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    userUID: string;
}

const useDashboardProjectUnassignedHandlers = ({ callback, projectUID, userUID }: IUseDashboardProjectUnassignedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.Dashboard,
        topicId: userUID,
        eventKey: `dashboard-project-unassigned-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.UNASSIGNED,
            params: { uid: projectUID },
            callback,
            responseConverter: () => {
                Project.Model.deleteModel(projectUID);
                return {};
            },
        },
    });
};

export default useDashboardProjectUnassignedHandlers;
