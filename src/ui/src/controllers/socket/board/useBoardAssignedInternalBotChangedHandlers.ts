import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";

export interface IBoardAssignedInternalBotChangedResponse {
    internal_bot_uid: string;
}

export interface IUseBoardAssignedInternalBotChangedHandlersProps extends IBaseUseSocketHandlersProps<IBoardAssignedInternalBotChangedResponse> {
    projectUID: string;
}

const useBoardAssignedInternalBotChangedHandlers = ({ callback, projectUID }: IUseBoardAssignedInternalBotChangedHandlersProps) => {
    return useSocketHandler<IBoardAssignedInternalBotChangedResponse>({
        topic: ESocketTopic.Board,
        topicId: projectUID,
        eventKey: `board-assigned-internal-bot-changed-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.ASSIGNED_INTERNAL_BOT_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useBoardAssignedInternalBotChangedHandlers;
