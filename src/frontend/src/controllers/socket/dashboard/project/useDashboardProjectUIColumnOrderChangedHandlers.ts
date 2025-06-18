import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IDashboardProjectUIColumnOrderChangedRawResponse {
    uid: string;
    order: number;
}

export interface IUseDashboardProjectUIColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardProjectUIColumnOrderChangedHandlers = ({ callback, projectUID }: IUseDashboardProjectUIColumnOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectUIColumnOrderChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-project-ui-column-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.COLUMN.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useDashboardProjectUIColumnOrderChangedHandlers;
