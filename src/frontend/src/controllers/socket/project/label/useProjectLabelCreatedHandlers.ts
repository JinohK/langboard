import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IProjectLabelCreatedRawResponse {
    label: ProjectLabel.Interface;
}

export interface IUseProjectLabelCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectLabelCreatedHandlers = ({ callback, projectUID }: IUseProjectLabelCreatedHandlersProps) => {
    return useSocketHandler<{}, IProjectLabelCreatedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectLabel.Model.fromObject(data.label, true);
                return {};
            },
        },
    });
};

export default useProjectLabelCreatedHandlers;
