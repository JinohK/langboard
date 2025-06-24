import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotSchedule } from "@/core/models";

export interface IBoardBotCronScheduledRawResponse {
    schedule: BotSchedule.Interface;
}

export interface IUseBoardBotCronScheduledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    botUID: string;
}

const useBoardBotCronScheduledHandlers = ({ callback, projectUID, botUID }: IUseBoardBotCronScheduledHandlersProps) => {
    return useSocketHandler<{}, IBoardBotCronScheduledRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-scheduled-${projectUID}-${botUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.SETTINGS.BOT_CRON.SCHEDULED,
            params: { uid: botUID },
            callback,
            responseConverter: (data) => {
                BotSchedule.Model.fromOne(data.schedule, true);
                return {};
            },
        },
    });
};

export default useBoardBotCronScheduledHandlers;
