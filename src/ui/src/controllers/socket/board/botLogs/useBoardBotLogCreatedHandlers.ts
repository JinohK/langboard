import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotLogModel } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotLogCreatedRawResponse {
    log: BotLogModel.Interface;
}

export interface IUseBoardBotLogCreatedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotLogCreatedHandlers = ({ callback, projectUID }: IUseBoardBotLogCreatedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotLogCreatedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-log-created-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.BOT.LOG.CREATED,
            callback,
            responseConverter: (data) => {
                BotLogModel.Model.fromOne(data.log, true);
                return {};
            },
        },
    });
};

export default useBoardBotLogCreatedHandlers;
