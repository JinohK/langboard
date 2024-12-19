import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IDashboardCardOrderChangedRequest {}

export interface IDashboardCardOrderChangedResponse {
    from_column_uid: string;
    to_column_uid: string;
}

export interface IUseDashboardCardOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IDashboardCardOrderChangedResponse> {
    projectUID: string;
}

const useDashboardCardOrderChangedHandlers = ({ socket, callback, projectUID }: IUseDashboardCardOrderChangedHandlersProps) => {
    return useSocketHandler<IDashboardCardOrderChangedRequest, IDashboardCardOrderChangedResponse>({
        socket,
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-card-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CARD.ORDER_CHANGED,
            callback,
        },
    });
};

export default useDashboardCardOrderChangedHandlers;
