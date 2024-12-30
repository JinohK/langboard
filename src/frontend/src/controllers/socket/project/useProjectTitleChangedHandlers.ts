import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";

export interface IProjectTitleChangedRawResponse {
    title: string;
}

export interface IUseProjectTitleChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectTitleChangedHandlers = ({ callback, projectUID }: IUseProjectTitleChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectTitleChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-title-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.TITLE_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const project = Project.Model.getModel(projectUID);
                if (project) {
                    project.title = data.title;
                }
                return {};
            },
        },
    });
};

export default useProjectTitleChangedHandlers;
