import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectTitleChangedRequest {}

export interface IProjectTitleChangedResponse {
    title: string;
}

export interface IUseProjectTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectTitleChangedResponse> {
    projectUID: string;
}

const useProjectTitleChangedHandlers = ({ socket, callback, projectUID }: IUseProjectTitleChangedHandlersProps) => {
    return useSocketHandler<IProjectTitleChangedRequest, IProjectTitleChangedResponse>({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-title-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.TITLE_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectTitleChangedHandlers;
