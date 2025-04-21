/* eslint-disable @typescript-eslint/no-explicit-any */
import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BotSchedule } from "@/core/models";

export interface IBoardBotCronRescheduledRawResponse {
    target_table?: BotSchedule.TTargetTable;
    target_uid?: string;
    filterable_table?: string;
    filterable_uid?: string;
    interval_str?: string;
}

export interface IUseBoardBotCronRescheduledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
    botUID: string;
    schedule: BotSchedule.TModel;
}

const useBoardBotCronRescheduledHandlers = ({ callback, projectUID, botUID, schedule }: IUseBoardBotCronRescheduledHandlersProps) => {
    return useSocketHandler<{}, IBoardBotCronRescheduledRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-rescheduled-${projectUID}-${botUID}-${schedule.uid}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.SETTINGS.BOT_CRON.RESCHEDULED,
            params: { uid: schedule.uid },
            callback,
            responseConverter: (data) => {
                Object.entries(data).forEach(([key, value]) => {
                    schedule[key] = value as any;
                });
                return {};
            },
        },
    });
};

export default useBoardBotCronRescheduledHandlers;
