import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.DASHBOARD.PROJECT.COLUMN.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useDashboardProjectUIColumnOrderChangedHandlers;
