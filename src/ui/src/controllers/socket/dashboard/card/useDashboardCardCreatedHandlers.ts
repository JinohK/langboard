import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, ProjectColumn } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardCardCreatedRawResponse {
    column_uid: string;
}

export interface IUseDashboardCardCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    project: Project.TModel;
}

const useDashboardCardCreatedHandlers = ({ callback, project }: IUseDashboardCardCreatedHandlersProps) => {
    return useSocketHandler<{}, IDashboardCardCreatedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: project.uid,
        eventKey: `dashboard-card-created-${project.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.DASHBOARD.CARD.CREATED,
            params: { uid: project.uid },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel((model) => model.uid === data.column_uid);
                if (!column) {
                    return {};
                }

                ++column.count;
                return {};
            },
        },
    });
};

export default useDashboardCardCreatedHandlers;
