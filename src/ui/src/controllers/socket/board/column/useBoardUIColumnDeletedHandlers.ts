import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { Project } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IUseBoardUIColumnDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    project: Project.TModel;
}

const useBoardUIColumnDeletedHandlers = ({ callback, project }: IUseBoardUIColumnDeletedHandlersProps) => {
    return useSocketHandler<{}, {}>({
        topic: ESocketTopic.Board,
        topicId: project.uid,
        eventKey: `board-ui-column-deleted-${project.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.COLUMN.DELETED,
            params: { uid: project.uid },
            callback,
        },
    });
};

export default useBoardUIColumnDeletedHandlers;
