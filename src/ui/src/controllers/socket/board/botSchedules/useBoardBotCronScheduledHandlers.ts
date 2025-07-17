import { SOCKET_SERVER_EVENTS } from "@/controllers/constants";
import useSocketHandler, { IBaseUseSocketHandlersProps } from "@/core/helpers/SocketHandler";
import { BaseBotScheduleModel, ProjectCardBotSchedule, ProjectColumnBotSchedule } from "@/core/models";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";
import { ESocketTopic } from "@langboard/core/enums";

export interface IBoardBotCronScheduledRawResponse {
    target_table: TBotRelatedTargetTable;
    schedule: BaseBotScheduleModel.Interface;
}

export interface IUseBoardBotCronScheduledHandlersProps extends IBaseUseSocketHandlersProps<{}> {
    projectUID: string;
}

const useBoardBotCronScheduledHandlers = ({ callback, projectUID }: IUseBoardBotCronScheduledHandlersProps) => {
    return useSocketHandler<{}, IBoardBotCronScheduledRawResponse>({
        topic: ESocketTopic.BoardSettings,
        topicId: projectUID,
        eventKey: `board-bot-cron-scheduled-${projectUID}`,
        onProps: {
            name: SOCKET_SERVER_EVENTS.BOARD.BOT.SCHEDULE.SCHEDULED,
            callback,
            responseConverter: (data) => {
                if (data.target_table === "project_column") {
                    ProjectColumnBotSchedule.Model.fromOne(data.schedule, true);
                } else if (data.target_table === "card") {
                    ProjectCardBotSchedule.Model.fromOne(data.schedule, true);
                }
                return {};
            },
        },
    });
};

export default useBoardBotCronScheduledHandlers;
