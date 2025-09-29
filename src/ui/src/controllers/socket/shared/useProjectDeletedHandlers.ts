import { SocketEvents } from "@langboard/core/constants";
import { deleteProjectModel } from "@/core/helpers/ModelHelper";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: topic === ESocketTopic.Board ? SocketEvents.SERVER.BOARD.DELETED : SocketEvents.SERVER.DASHBOARD.PROJECT.DELETED,
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
