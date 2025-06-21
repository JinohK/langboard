import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectLabel } from "@/core/models";

export interface IBoardLabelCreatedRawResponse {
    label: ProjectLabel.Interface;
}

export interface IUseBoardLabelCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardLabelCreatedHandlers = ({ callback, projectUID }: IUseBoardLabelCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardLabelCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-label-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.LABEL.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectLabel.Model.fromObject(data.label, true);
                return {};
            },
        },
    });
};

export default useBoardLabelCreatedHandlers;
