import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectAIDescriptionChangedResponse {
    ai_description?: string;
}

export interface IUseProjectAIDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectAIDescriptionChangedResponse> {
    projectUID: string;
}

const useProjectAIDescriptionChangedHandlers = ({ socket, callback, projectUID }: IUseProjectAIDescriptionChangedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-ai-description-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.AI_DESCRIPTION_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectAIDescriptionChangedHandlers;
