import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IDashboardProjectColumnNameChangedRawResponse {
    uid: string;
    name: string;
}

export interface IUseDashboardProjectColumnNameChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useDashboardProjectColumnNameChangedHandlers = ({ callback, projectUID }: IUseDashboardProjectColumnNameChangedHandlersProps) => {
    return useSocketHandler<{}, IDashboardProjectColumnNameChangedRawResponse>({
        topic: ESocketTopic.Dashboard,
        topicId: projectUID,
        eventKey: `dashboard-project-column-name-changed-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.DASHBOARD.PROJECT.COLUMN.NAME_CHANGED,
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
