import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotSchedule } from "@/core/models";
import { ESocketTopic } from "@langboard/core/enums";

export type TBoardBotCronRescheduledRawResponse = Partial<Omit<BotSchedule.Interface, "uid" | "bot_uid">>;

export interface IUseBoardBotCronRescheduledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    botUID: string;
    schedule: BotSchedule.TModel;
}

const useBoardBotCronRescheduledHandlers = ({ callback, projectUID, botUID, schedule }: IUseBoardBotCronRescheduledHandlersProps) => {
    return useSocketHandler<{}, TBoardBotCronRescheduledRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-rescheduled-${projectUID}-${botUID}-${schedule.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.SETTINGS.BOT_CRON.RESCHEDULED,
            params: { uid: schedule.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    schedule[key] = value as never;
                });
                return {};
            },
        },
    });
};

export default useBoardBotCronRescheduledHandlers;
