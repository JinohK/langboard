import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectTypeChangedResponse {
    project_type: string;
}

export interface IUseProjectTypeChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectTypeChangedResponse> {
    projectUID: string;
}

const useProjectTypeChangedHandlers = ({ socket, callback, projectUID }: IUseProjectTypeChangedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-type-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.TYPE_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectTypeChangedHandlers;
