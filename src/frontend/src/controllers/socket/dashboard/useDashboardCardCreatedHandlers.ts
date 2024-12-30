import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IDashboardCardCreatedRawResponse {
    column_uid: string;
}

export interface IUseDashboardCardCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCardCreatedHandlers = ({ callback, projectUID }: IUseDashboardCardCreatedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCardCreatedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `dashboard-card-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CARD.CREATED,
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
                        ++columns[i].count;
                        break;
                    }
                }
                project.columns = columns;
                return {};
            },
        },
    });
};

export default useDashboardCardCreatedHandlers;
