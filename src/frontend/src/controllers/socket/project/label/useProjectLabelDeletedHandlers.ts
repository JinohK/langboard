import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectLabelDeletedResponse {
    uid: string;
}

export interface IUseProjectLabelDeletedHandlersProps extends IBaseUseSocketHandlersProps<IProjectLabelDeletedResponse> {
    projectUID: string;
}

const useProjectLabelDeletedHandlers = ({ socket, callback, projectUID }: IUseProjectLabelDeletedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.DELETED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectLabelDeletedHandlers;
