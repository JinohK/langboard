import { SocketEvents } from "@langboard/core/constants";
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
            name: SocketEvents.SERVER.BOARD.COLUMN.DELETED,
            params: { uid: project.uid },
            callback,
        },
    });
};

export default useBoardUIColumnDeletedHandlers;
