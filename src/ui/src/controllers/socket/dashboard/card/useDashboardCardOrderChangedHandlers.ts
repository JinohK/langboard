import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, ProjectCard } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardCardOrderChangedRawResponse {
    uid: string;
    from_column_uid: string;
    to_column_uid: string;
    column_name: string;
    archived_at: string;
}

export interface IUseDashboardCardOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCardOrderChangedHandlers = ({ callback, projectUID }: IUseDashboardCardOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCardOrderChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-card-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CARD.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    const columns = project.columns;
                    for (let i = 0; i < columns.length; ++i) {
                        if (columns[i].uid === data.from_column_uid) {
                            --columns[i].count;
                        } else if (columns[i].uid === data.to_column_uid) {
                            ++columns[i].count;
                        }
                    }
                    project.columns = columns;
                }

                const card = ProjectCard.Model.getModel(data.uid);
                if (card) {
                    card.column_uid = data.to_column_uid;
                    card.column_name = data.column_name;
                    card.archived_at = data.archived_at;
                }

                return {};
            },
        },
    });
};

export default useDashboardCardOrderChangedHandlers;
