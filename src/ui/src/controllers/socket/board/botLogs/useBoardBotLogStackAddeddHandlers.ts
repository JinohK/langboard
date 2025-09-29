import { SocketEvents } from "@langboard/core/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotLogModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotLogStackAddedRawResponse {
    uid: string;
    updated_at: string;
    stack: BotLogModel.ILogMessageStack;
}

export interface IUseBoardBotLogStackAddedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotLogStackAddedHandlers = ({ callback, projectUID }: IUseBoardBotLogStackAddedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotLogStackAddedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-log-updated-${projectUID}`,
        onProps: {
            name: SocketEvents.SERVER.BOARD.BOT.LOG.STACK_ADDED,
            callback,
            responseConverter: (data) => {
                const botLog = BotLogModel.Model.getModel(data.uid);
                if (botLog) {
                    botLog.updated_at = data.updated_at;
                    botLog.message_stack = [...botLog.message_stack, data.stack];
                }

                return {};
            },
        },
    });
};

export default useBoardBotLogStackAddedHandlers;
