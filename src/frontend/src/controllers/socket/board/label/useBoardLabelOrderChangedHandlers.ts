import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IBoardLabelOrderChangedRawResponse {
    uid: string;
    order: number;
}

export interface IUseBoardLabelOrderChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardLabelOrderChangedHandlers = ({ callback, projectUID }: IUseBoardLabelOrderChangedHandlersProps) => {
    return useSocketHandler<{}, IBoardLabelOrderChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-label-order-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.LABEL.ORDER_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const label = ProjectLabel.Model.getModel(data.uid);
                if (label) {
                    label.order = data.order;
                }
                return {};
            },
        },
    });
};

export default useBoardLabelOrderChangedHandlers;
