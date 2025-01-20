import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IDashboardProjectCardDeletedRawResponse {
    column_uid: string;
}

export interface IUseDashboardProjectCardDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardProjectCardDeletedHandlers = ({ callback, projectUID }: IUseDashboardProjectCardDeletedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectCardDeletedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-project-card-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.CARD.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (!project) {
                    return {};
                }

                const columns = project.columns;
                for (let i = 0; i < columns.length; ++i) {
                    if (columns[i].uid === data.column_uid) {
                        --columns[i].count;
                        break;
                    }
                }
                project.columns = columns;
                return {};
            },
        },
    });
};

export default useDashboardProjectCardDeletedHandlers;
