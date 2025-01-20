import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { deleteProjectModel } from "@/core/helpers/ModelHelper";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IUseProjectDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    topic: ESocketTopic.Board | ESocketTopic.Dashboard;
    projectUID: string;
}

const useProjectDeletedHandlers = ({ callback, topic, projectUID }: IUseProjectDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: topic,
        topicId: projectUID,
        eventKey: `project-deleted-${topic}-${projectUID}`,
        onProps: {
            name: topic === ESocketTopic.Board ? SOCKET_SERVER_EVENTS.BOARD.DELETED : SOCKET_SERVER_EVENTS.DASHBOARD.PROJECT.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: () => {
                deleteProjectModel(topic, projectUID);
                return {};
            },
        },
    });
};

export default useProjectDeletedHandlers;
