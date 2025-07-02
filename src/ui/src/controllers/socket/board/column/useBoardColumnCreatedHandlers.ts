import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardColumnCreatedRawResponse {
    column: ProjectColumn.IStore;
}

export interface IUseBoardColumnCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardColumnCreatedHandlers = ({ callback, projectUID }: IUseBoardColumnCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardColumnCreatedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-column-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.COLUMN.CREATED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                ProjectColumn.Model.fromOne(data.column, true);
                return {};
            },
        },
    });
};

export default useBoardColumnCreatedHandlers;
