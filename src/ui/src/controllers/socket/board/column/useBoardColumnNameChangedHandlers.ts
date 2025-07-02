import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ProjectColumn } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardColumnNameChangedRawResponse {
    uid: string;
    name: string;
}

export interface IUseBoardColumnNameChangedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardColumnNameChangedHandlers = ({ callback, projectUID }: IUseBoardColumnNameChangedHandlersProps) => {
    return useSocketHandler<{}, IBoardColumnNameChangedRawResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-column-name-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.COLUMN.NAME_CHANGED,
            params: { uid: projectUID },
            callback,
            responseConverter: (data) => {
                const column = ProjectColumn.Model.getModel(data.uid);
                if (column) {
                    column.name = data.name;
                }
                return {};
            },
        },
    });
};

export default useBoardColumnNameChangedHandlers;
