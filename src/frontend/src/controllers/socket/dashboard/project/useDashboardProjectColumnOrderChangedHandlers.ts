import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IDashboardProjectColumnOrderChangedRawResponse {
    uid: string;
    order: number;
}

export interface IUseDashboardProjectColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    userUID: string;
}

const useDashboardProjectColumnOrderChangedHandlers = ({ callback, projectUID, userUID }: IUseDashboardProjectColumnOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectColumnOrderChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: userUID,
        eventKey: `dashboard-project-column-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.COLUMN.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel(data.uid);
                if (column) {
                    column.order = data.order;
                }
                return {};
            },
        },
    });
};

export default useDashboardProjectColumnOrderChangedHandlers;
