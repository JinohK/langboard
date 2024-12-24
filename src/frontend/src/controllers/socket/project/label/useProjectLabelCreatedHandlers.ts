import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IProjectLabelCreatedResponse {
    label: ProjectLabel.Interface;
}

export interface IUseProjectLabelCreatedHandlersProps extends IBaseUseSocketHandlersProps<IProjectLabelCreatedResponse> {
    projectUID: string;
}

const useProjectLabelCreatedHandlers = ({ socket, callback, projectUID }: IUseProjectLabelCreatedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.CREATED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectLabelCreatedHandlers;
