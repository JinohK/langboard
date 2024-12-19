import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IDashboardCardCreatedRequest {}

export interface IDashboardCardCreatedResponse {
    column_uid: string;
}

export interface IUseDashboardCardCreatedHandlersProps extends IBaseUseSocketHandlersProps<IDashboardCardCreatedResponse> {
    projectUID: string;
}

const useDashboardCardCreatedHandlers = ({ socket, callback, projectUID }: IUseDashboardCardCreatedHandlersProps) => {
    return useSocketHandler<IDashboardCardCreatedRequest, IDashboardCardCreatedResponse>({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `dashboard-card-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CARD.CREATED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useDashboardCardCreatedHandlers;
