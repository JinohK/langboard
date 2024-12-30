import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IProjectLabelDeletedRawResponse {
    uid: string;
}

export interface IUseProjectLabelDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectLabelDeletedHandlers = ({ callback, projectUID }: IUseProjectLabelDeletedHandlersProps) => {
    return useSocketHandler<{}, IProjectLabelDeletedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-label-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.LABEL.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectLabel.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useProjectLabelDeletedHandlers;
