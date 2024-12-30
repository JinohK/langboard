import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IProjectColumnCreatedRawResponse {
    column: ProjectColumn.IStore;
}

export interface IUseProjectColumnCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectColumnCreatedHandlers = ({ callback, projectUID }: IUseProjectColumnCreatedHandlersProps) => {
    return useSocketHandler<{}, IProjectColumnCreatedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-column-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.COLUMN.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectColumn.Model.fromObject(data.column, true);
                return {};
            },
        },
    });
};

export default useProjectColumnCreatedHandlers;
