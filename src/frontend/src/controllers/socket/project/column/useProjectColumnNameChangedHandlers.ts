import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IProjectColumnNameChangedRequest {}

export interface IProjectColumnNameChangedResponse {
    uid: string;
    name: string;
}

export interface IUseProjectColumnNameChangedHandlersProps extends IBaseUseSocketHandlersProps<IProjectColumnNameChangedResponse> {
    projectUID: string;
}

const useProjectColumnNameChangedHandlers = ({ socket, callback, projectUID }: IUseProjectColumnNameChangedHandlersProps) => {
    return useSocketHandler<IProjectColumnNameChangedRequest, IProjectColumnNameChangedResponse>({
        socket,
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-column-name-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.COLUMN.NAME_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useProjectColumnNameChangedHandlers;
