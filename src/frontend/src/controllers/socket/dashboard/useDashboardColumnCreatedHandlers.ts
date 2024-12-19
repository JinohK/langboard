import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IDashboardColumnCreatedRequest {}

export interface IDashboardColumnCreatedResponse {
    column: ProjectColumn.IDashboard;
}

export interface IUseDashboardColumnCreatedHandlersProps extends IBaseUseSocketHandlersProps<IDashboardColumnCreatedResponse> {
    projectUID: string;
}

const useDashboardColumnCreatedHandlers = ({ socket, callback, projectUID }: IUseDashboardColumnCreatedHandlersProps) => {
    return useSocketHandler<IDashboardColumnCreatedRequest, IDashboardColumnCreatedResponse>({
        socket,
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-column-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.COLUMN.CREATED,
            callback,
        },
    });
};

export default useDashboardColumnCreatedHandlers;
