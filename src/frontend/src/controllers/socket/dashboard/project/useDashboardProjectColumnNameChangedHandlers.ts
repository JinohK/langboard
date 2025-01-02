import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IDashboardProjectColumnNameChangedRawResponse {
    uid: string;
    name: string;
}

export interface IUseDashboardProjectColumnNameChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    userUID: string;
}

const useDashboardProjectColumnNameChangedHandlers = ({ callback, projectUID, userUID }: IUseDashboardProjectColumnNameChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectColumnNameChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: userUID,
        eventKey: `dashboard-project-column-name-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.COLUMN.NAME_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel(data.uid);
                if (column) {
                    column.name = data.name;
                }
                return {};
            },
        },
    });
};

export default useDashboardProjectColumnNameChangedHandlers;
