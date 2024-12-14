import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardColumnNameChangedRequest {}

export interface IBoardColumnNameChangedResponse {
    uid: string;
    name: string;
}

export interface IUseBoardColumnNameChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardColumnNameChangedResponse> {
    projectUID: string;
}

const useBoardColumnNameChangedHandlers = ({ socket, callback, projectUID }: IUseBoardColumnNameChangedHandlersProps) => {
    return useSocketHandler<IBoardColumnNameChangedRequest, IBoardColumnNameChangedResponse>({
        socket,
        topic: ESocketTopic.Board,
        id: projectUID,
        eventKey: `board-column-name-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.COLUMN_NAME_CHANGED,
            params: { uid: projectUID },
            callback,
        },
        sendProps: {
            name: "",
        },
    });
};

export default useBoardColumnNameChangedHandlers;
