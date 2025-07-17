import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";

interface IBaseBotScheduleRelatedParams {
    target_table: TBotRelatedTargetTable;
    project_uid?: string;
}

interface IProjectColumnBotScheduleParams extends IBaseBotScheduleRelatedParams {
    target_table: "project_column";
    project_uid: string;
}

interface ICardBotScheduleParams extends IBaseBotScheduleRelatedParams {
    target_table: "card";
    project_uid: string;
}

export type TBotScheduleRelatedParams = IProjectColumnBotScheduleParams | ICardBotScheduleParams;
