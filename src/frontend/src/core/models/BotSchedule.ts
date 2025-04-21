import useBoardBotCronDeletedHandlers from "@/controllers/socket/board/settings/useBoardBotCronDeletedHandlers";
import useBoardBotCronRescheduledHandlers from "@/controllers/socket/board/settings/useBoardBotCronRescheduledHandlers";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";

export type TTargetTable = "project_column" | "card";
export const TARGET_TABLES: TTargetTable[] = ["project_column", "card"];

export interface Interface extends IBaseModel {
    bot_uid: string;
    target_table: TTargetTable;
    target_uid: string;
    filterable_table?: string;
    filterable_uid?: string;
    interval_str: string;
}

class BotSchedule extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "BotSchedule" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        if (this.filterable_table === "project" && this.filterable_uid) {
            this.subscribeSocketEvents([useBoardBotCronRescheduledHandlers, useBoardBotCronDeletedHandlers], {
                projectUID: this.filterable_uid,
                botUID: this.bot_uid,
                scheduleUID: this.uid,
                schedule: this,
            });
        }
    }

    public get bot_uid() {
        return this.getValue("bot_uid");
    }
    public set bot_uid(value: string) {
        this.update({ bot_uid: value });
    }

    public get target_table() {
        return this.getValue("target_table");
    }
    public set target_table(value: TTargetTable) {
        this.update({ target_table: value });
    }

    public get target_uid() {
        return this.getValue("target_uid");
    }
    public set target_uid(value: string) {
        this.update({ target_uid: value });
    }

    public get filterable_table() {
        return this.getValue("filterable_table");
    }
    public set filterable_table(value: string | undefined) {
        this.update({ filterable_table: value });
    }

    public get filterable_uid() {
        return this.getValue("filterable_uid");
    }
    public set filterable_uid(value: string | undefined) {
        this.update({ filterable_uid: value });
    }

    public get interval_str() {
        return this.getValue("interval_str");
    }
    public set interval_str(value: string) {
        this.update({ interval_str: value });
    }
}

registerModel(BotSchedule);

export const Model = BotSchedule;
export type TModel = BotSchedule;
