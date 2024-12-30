import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IProjectAIDescriptionChangedRawResponse {
    ai_description?: string;
}

export interface IUseProjectAIDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectAIDescriptionChangedHandlers = ({ callback, projectUID }: IUseProjectAIDescriptionChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectAIDescriptionChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-ai-description-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.AI_DESCRIPTION_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    project.ai_description = data.ai_description;
                }
                return {};
            },
        },
    });
};

export default useProjectAIDescriptionChangedHandlers;
