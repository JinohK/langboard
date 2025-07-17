import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";

interface IBaseBotLogRelatedParams {
    target_table: TBotRelatedTargetTable;
    project_uid?: string;
}

interface IProjectColumnBotLogParams extends IBaseBotLogRelatedParams {
    target_table: "project_column";
    project_uid: string;
}

interface ICardBotLogParams extends IBaseBotLogRelatedParams {
    target_table: "card";
    project_uid: string;
}

export type TBotLogRelatedParams = IProjectColumnBotLogParams | ICardBotLogParams;
