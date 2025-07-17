import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";

interface IBaseBotScopeRelatedParams {
    target_table: TBotRelatedTargetTable;
    target_uid: string;
    project_uid?: string;
}

interface IProjectColumnBotScopeParams extends IBaseBotScopeRelatedParams {
    target_table: "project_column";
    project_uid: string;
}

interface ICardBotScopeParams extends IBaseBotScopeRelatedParams {
    target_table: "card";
    project_uid: string;
}

export type TBotScopeRelatedParams = IProjectColumnBotScopeParams | ICardBotScopeParams;
