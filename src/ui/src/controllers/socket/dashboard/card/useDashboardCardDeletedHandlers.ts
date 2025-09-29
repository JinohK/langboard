import { SocketEvents } from "@langboard/core/constants";
import { deleteCardModel } from "@/core/helpers/ModelHelper";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project, ProjectCard, ProjectColumn } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboarCardDeletedRawResponse {
    uid: string;
    column_uid: string;
}

export interface IUseDashboardCardDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    project: Project.TModel;
}

const useDashboardCardDeletedHandlers = ({ callback, project }: IUseDashboardCardDeletedHandlersProps) => {
    return useSocketHandler<{}, IDashboarCardDeletedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: project.uid,
        eventKey: `dashboard-card-deleted-${project.uid}`,
        onProps: {
            name: SocketEvents.SERVER.DASHBOARD.CARD.DELETED,
            params: { uid: project.uid },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel((model) => model.uid === data.column_uid);
                if (column) {
                    --column.count;
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
