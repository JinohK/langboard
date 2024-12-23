import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectColumnOrderChangedRequest {}

export interface IProjectColumnOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseProjectColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectColumnOrderChangedResponse> {
    projectUID: string;
}

const useProjectColumnOrderChangedHandlers = ({ socket, callback, projectUID }: IUseProjectColumnOrderChangedHandlersProps) => {
    return useSocketHandler<IProjectColumnOrderChangedRequest, IProjectColumnOrderChangedResponse>({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-column-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.COLUMN.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectColumnOrderChangedHandlers;
