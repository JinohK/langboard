import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IDashboardProjectCardOrderChangedRawResponse {
    from_column_uid: string;
    to_column_uid: string;
}

export interface IUseDashboardProjectCardOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    userUID: string;
}

const useDashboardProjectCardOrderChangedHandlers = ({ callback, projectUID, userUID }: IUseDashboardProjectCardOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectCardOrderChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: userUID,
        eventKey: `dashboard-project-card-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.CARD.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (!project) {
                    return {};
                }

                const columns = project.columns;
                for (let i = 0; i < columns.length; ++i) {
                    if (columns[i].uid === data.from_column_uid) {
                        --columns[i].count;
                    } else if (columns[i].uid === data.to_column_uid) {
                        ++columns[i].count;
                    }
                }
                project.columns = columns;
                return {};
            },
        },
    });
};

export default useDashboardProjectCardOrderChangedHandlers;
