import useBoardBotCronDeletedHandlers from "@/controllers/socket/board/settings/useBoardBotCronDeletedHandlers";
import useBoardBotCronRescheduledHandlers from "@/controllers/socket/board/settings/useBoardBotCronRescheduledHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import { convertSafeEnum } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export type TTargetTable = "project_column" | "card";
export const TARGET_TABLES: TTargetTable[] = ["project_column", "card"];

export enum ERunningType {
    Infinite = "infinite",
    Duration = "duration",
    Reserved = "reserved",
    Onetime = "onetime",
}

export enum EStatus {
    Pending = "pending",
    Started = "started",
    Stopped = "stopped",
}

export interface Interface extends IBaseModel {
    bot_uid: string;
    running_type: ERunningType;
    status: EStatus;
    target_table: TTargetTable;
    target_uid: string;
    filterable_table?: string;
    filterable_uid?: string;
    interval_str: string;
    start_at?: Date;
    end_at?: Date;
}

export const RUNNING_TYPES_WITH_START_AT = [ERunningType.Duration, ERunningType.Reserved, ERunningType.Onetime];
export const RUNNING_TYPES_WITH_END_AT = [ERunningType.Duration];

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

    public static convertModel(model: Interface): Interface {
        if (TypeUtils.isString(model.running_type)) {
            model.running_type = convertSafeEnum(ERunningType, model.running_type);
        }
        if (TypeUtils.isString(model.status)) {
            model.status = convertSafeEnum(EStatus, model.status);
        }
        if (TypeUtils.isString(model.start_at)) {
            model.start_at = new Date(model.start_at);
        }
        if (TypeUtils.isString(model.end_at)) {
            model.end_at = new Date(model.end_at);
        }
        return model;
    }

    public get bot_uid() {
        return this.getValue("bot_uid");
    }
    public set bot_uid(value) {
        this.update({ bot_uid: value });
    }

    public get running_type() {
        return this.getValue("running_type");
    }
    public set running_type(value) {
        this.update({ running_type: value });
    }

    public get status() {
        return this.getValue("status");
    }
    public set status(value) {
        this.update({ status: value });
    }

    public get target_table() {
        return this.getValue("target_table");
    }
    public set target_table(value) {
        this.update({ target_table: value });
    }

    public get target_uid() {
        return this.getValue("target_uid");
    }
    public set target_uid(value) {
        this.update({ target_uid: value });
    }

    public get filterable_table() {
        return this.getValue("filterable_table");
    }
    public set filterable_table(value) {
        this.update({ filterable_table: value });
    }

    public get filterable_uid() {
        return this.getValue("filterable_uid");
    }
    public set filterable_uid(value) {
        this.update({ filterable_uid: value });
    }

    public get interval_str() {
        return this.getValue("interval_str");
    }
    public set interval_str(value) {
        this.update({ interval_str: value });
    }

    public get start_at() {
        return this.getValue("start_at");
    }
    public set start_at(value: Date | undefined) {
        this.update({ start_at: value });
    }

    public get end_at() {
        return this.getValue("end_at");
    }
    public set end_at(value: Date | undefined) {
        this.update({ end_at: value });
    }
}

registerModel(BotSchedule);

export const Model = BotSchedule;
export type TModel = BotSchedule;
