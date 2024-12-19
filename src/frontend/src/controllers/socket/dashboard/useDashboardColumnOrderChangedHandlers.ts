import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IDashboardColumnOrderChangedRequest {}

export interface IDashboardColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseDashboardColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IDashboardColumnOrderChangedResponse> {
    projectUID: string;
}

const useDashboardColumnOrderChangedHandlers = ({ socket, callback, projectUID }: IUseDashboardColumnOrderChangedHandlersProps) => {
    return useSocketHandler<IDashboardColumnOrderChangedRequest, IDashboardColumnOrderChangedResponse>({
        socket,
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-column-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.COLUMN.ORDER_CHANGED,
            callback,
        },
    });
};

export default useDashboardColumnOrderChangedHandlers;
