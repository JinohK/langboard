import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotSchedule } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotCronDeletedRawResponse {
    uid: string;
}

export interface IUseBoardBotCronDeletedHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    botUID: string;
    scheduleUID: string;
}

const useBoardBotCronDeletedHandlers = ({ callback, projectUID, botUID, scheduleUID }: IUseBoardBotCronDeletedHandlersProps) => {
    return useSocketHandler<{}, IBoardBotCronDeletedRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-scheduled-${projectUID}-${botUID}-${scheduleUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.SETTINGS.BOT_CRON.SCHEDULED,
            params: { uid: scheduleUID },
            callback,
            responseConverter: (data) => {
                BotSchedule.Model.deleteModel(data.uid);
                return {};
            },
        },
    });
};

export default useBoardBotCronDeletedHandlers;
