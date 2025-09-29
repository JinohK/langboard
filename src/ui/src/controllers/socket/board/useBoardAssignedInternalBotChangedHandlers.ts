import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { ESocketTopic } from "@langboard/core/enums";

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
            name: SocketEvents.SERVER.BOARD.ASSIGNED_INTERNAL_BOT_CHANGED,
            params: { uid: projectUID },
            callback,
        },
    });
};

export default useBoardAssignedInternalBotChangedHandlers;
