import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IProjectTypeChangedRawResponse {
    project_type: string;
}

export interface IUseProjectTypeChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectTypeChangedHandlers = ({ callback, projectUID }: IUseProjectTypeChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectTypeChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-type-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.TYPE_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    project.project_type = data.project_type;
                }
                return {};
            },
        },
    });
};

export default useProjectTypeChangedHandlers;
