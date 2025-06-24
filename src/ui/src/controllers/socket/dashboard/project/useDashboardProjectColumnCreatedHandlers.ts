import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IDashboardProjectColumnCreatedRawResponse {
    column: ProjectColumn.IStore;
}

export interface IUseDashboardProjectColumnCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardProjectColumnCreatedHandlers = ({ callback, projectUID }: IUseDashboardProjectColumnCreatedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectColumnCreatedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-project-column-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.COLUMN.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectColumn.Model.fromOne(data.column, true);
                return {};
            },
        },
    });
};

export default useDashboardProjectColumnCreatedHandlers;
