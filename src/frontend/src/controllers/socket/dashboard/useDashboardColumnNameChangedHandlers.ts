import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IDashboardColumnNameChangedRequest {}

export interface IDashboardColumnNameChangedResponse {
    uid: string;
    name: string;
}

export interface IUseDashboardColumnNameChangedHandlersProps extends IBaseUseSocketHandlersProps<IDashboardColumnNameChangedResponse> {
    projectUID: string;
}

const useDashboardColumnNameChangedHandlers = ({ socket, callback, projectUID }: IUseDashboardColumnNameChangedHandlersProps) => {
    return useSocketHandler<IDashboardColumnNameChangedRequest, IDashboardColumnNameChangedResponse>({
        socket,
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-column-name-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.COLUMN.NAME_CHANGED,
            callback,
        },
    });
};

export default useDashboardColumnNameChangedHandlers;
