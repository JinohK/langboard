import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";

export interface IBoardColumnOrderChangedRawResponse {
    uid: string;
    order: number;
}

export interface IUseBoardColumnOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardColumnOrderChangedHandlers = ({ callback, projectUID }: IUseBoardColumnOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IBoardColumnOrderChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-column-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.COLUMN.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel(data.uid);
                if (column) {
                    column.order = data.order;
                }
                return {};
            },
        },
    });
};

export default useBoardColumnOrderChangedHandlers;
