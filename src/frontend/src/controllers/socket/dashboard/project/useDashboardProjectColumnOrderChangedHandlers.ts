import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

export interface IDashboardProjectColumnOrderChangedRawResponse {
    uid: string;
    order: number;
}

export interface IUseDashboardProjectColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardProjectColumnOrderChangedHandlers = ({ callback, projectUID }: IUseDashboardProjectColumnOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectColumnOrderChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-project-column-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.COLUMN.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const targetColumn = ProjectColumn.Model.getModel(data.uid);
                if (targetColumn && targetColumn.order !== data.order) {
                    const flatColumns = ProjectColumn.Model.getModels((model) => model.project_uid === projectUID);
                    const columns = flatColumns.sort((a, b) => a.order - b.order);

                    const reordered = reorder({ list: columns, startIndex: targetColumn.order, finishIndex: data.order });
                    reordered.forEach((item, index) => {
                        item.order = index;
                    });
                }
                return {};
            },
        },
    });
};

export default useDashboardProjectColumnOrderChangedHandlers;
