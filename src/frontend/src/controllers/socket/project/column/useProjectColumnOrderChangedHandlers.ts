import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IProjectColumnOrderChangedRawResponse {
    uid: string;
    order: number;
}

export interface IUseProjectColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectColumnOrderChangedHandlers = ({ callback, projectUID }: IUseProjectColumnOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectColumnOrderChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-column-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.COLUMN.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel(data.uid);
                if (column) {
                    column.order = data.order;
                }
                return {};
            },
        },
    });
};

export default useProjectColumnOrderChangedHandlers;
