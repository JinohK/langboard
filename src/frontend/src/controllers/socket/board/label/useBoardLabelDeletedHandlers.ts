import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IBoardLabelDeletedRawResponse {
    uid: string;
}

export interface IUseBoardLabelDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardLabelDeletedHandlers = ({ callback, projectUID }: IUseBoardLabelDeletedHandlersProps) => {
    return useSocketHandler<{}, IBoardLabelDeletedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-label-deleted-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.LABEL.DELETED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectLabel.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useBoardLabelDeletedHandlers;
