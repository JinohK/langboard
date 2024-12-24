import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IProjectColumnCreatedResponse {
    column: ProjectColumn.IDashboard;
}

export interface IUseProjectColumnCreatedHandlersProps extends IBaseUseSocketHandlersProps<IProjectColumnCreatedResponse> {
    projectUID: string;
}

const useProjectColumnCreatedHandlers = ({ socket, callback, projectUID }: IUseProjectColumnCreatedHandlersProps) => {
    return useSocketHandler({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-column-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.COLUMN.CREATED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectColumnCreatedHandlers;
