import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IProjectColumnNameChangedRawResponse {
    uid: string;
    name: string;
}

export interface IUseProjectColumnNameChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useProjectColumnNameChangedHandlers = ({ callback, projectUID }: IUseProjectColumnNameChangedHandlersProps) => {
    return useSocketHandler<{}, IProjectColumnNameChangedRawResponse>({
        topic: ESocketTopic.Project,
        topicId: projectUID,
        eventKey: `project-column-name-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.PROJECT.COLUMN.NAME_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel(data.uid);
                if (column) {
                    column.name = data.name;
                }
                return {};
            },
        },
    });
};

export default useProjectColumnNameChangedHandlers;
