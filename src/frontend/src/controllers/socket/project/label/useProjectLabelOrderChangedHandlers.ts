import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectLabelOrderChangedRequest {}

export interface IProjectLabelOrderChangedResponse {
    uid: string;
    order: number;
}

export interface IUseProjectLabelOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectLabelOrderChangedResponse> {
    projectUID: string;
}

const useProjectLabelOrderChangedHandlers = ({ socket, callback, projectUID }: IUseProjectLabelOrderChangedHandlersProps) => {
    return useSocketHandler<IProjectLabelOrderChangedRequest, IProjectLabelOrderChangedResponse>({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectLabelOrderChangedHandlers;
