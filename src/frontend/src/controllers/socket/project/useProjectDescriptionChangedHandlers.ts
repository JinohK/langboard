import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IProjectDescriptionChangedRawResponse {
    description: string;
}

export interface IUseProjectDescriptionChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectDescriptionChangedHandlers = ({ callback, projectUID }: IUseProjectDescriptionChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectDescriptionChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-description-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.DESCRIPTION_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    project.description = data.description;
                }
                return {};
            },
        },
    });
};

export default useProjectDescriptionChangedHandlers;
