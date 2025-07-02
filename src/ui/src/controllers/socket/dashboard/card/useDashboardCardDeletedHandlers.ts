import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import { deleteCardModel } from "@/core/helpers/ModelHelper";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, ProjectCard } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboarCardDeletedRawResponse {
    uid: string;
    column_uid: string;
}

export interface IUseDashboardCardDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardCardDeletedHandlers = ({ callback, projectUID }: IUseDashboardCardDeletedHandlersProps) => {
    return useSocketHandler<{}, IDashboarCardDeletedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-card-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CARD.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    const columns = project.columns;
                    for (let i = 0; i < columns.length; ++i) {
                        if (columns[i].uid === data.column_uid) {
                            --columns[i].count;
                            break;
                        }
                    }
                    project.columns = columns;
                }

                const card = ProjectCard.Model.getModel(data.uid);
                if (card) {
                    deleteCardModel(card.uid, true);
                }
                return {};
            },
        },
    });
};

export default useDashboardCardDeletedHandlers;
