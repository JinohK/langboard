import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IBoardColumnCreatedRequest {}

export interface IBoardColumnCreatedResponse {
    column: ProjectColumn.Interface;
}

export interface IUseBoardColumnCreatedHandlersProps extends IBaseUseSocketHandlersProps<IBoardColumnCreatedResponse> {
    projectUID: string;
}

const useBoardColumnCreatedHandlers = ({ socket, callback, projectUID }: IUseBoardColumnCreatedHandlersProps) => {
    return useSocketHandler<IBoardColumnCreatedRequest, IBoardColumnCreatedResponse>({
        socket,
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-column-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.COLUMN.CREATED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useBoardColumnCreatedHandlers;
