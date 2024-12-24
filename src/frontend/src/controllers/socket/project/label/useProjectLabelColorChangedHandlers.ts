import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectLabelColorChangedResponse {
    color: string;
}

export interface IUseProjectLabelColorChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectLabelColorChangedResponse> {
    projectUID: string;
    labelUID: string;
}

const useProjectLabelColorChangedHandlers = ({ socket, callback, projectUID, labelUID }: IUseProjectLabelColorChangedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-color-changed-${labelUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.COLOR_CHANGED,
            params: { uid: labelUID },
            callback,
        },
    });
};

export default useProjectLabelColorChangedHandlers;
