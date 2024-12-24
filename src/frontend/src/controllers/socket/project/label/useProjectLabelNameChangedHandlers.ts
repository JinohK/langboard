import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectLabelNameChangedResponse {
    name: string;
}

export interface IUseProjectLabelNameChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectLabelNameChangedResponse> {
    projectUID: string;
    labelUID: string;
}

const useProjectLabelNameChangedHandlers = ({ socket, callback, projectUID, labelUID }: IUseProjectLabelNameChangedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-name-changed-${labelUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.NAME_CHANGED,
            params: { uid: labelUID },
            callback,
        },
    });
};

export default useProjectLabelNameChangedHandlers;
