import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectDescriptionChangedRequest {}

export interface IProjectDescriptionChangedResponse {
    description?: string;
}

export interface IUseProjectDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectDescriptionChangedResponse> {
    projectUID: string;
}

const useProjectDescriptionChangedHandlers = ({ socket, callback, projectUID }: IUseProjectDescriptionChangedHandlersProps) => {
    return useSocketHandler<IProjectDescriptionChangedRequest, IProjectDescriptionChangedResponse>({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-description-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.DESCRIPTION_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectDescriptionChangedHandlers;
