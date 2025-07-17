import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";
import { TBotRelatedTargetTable } from "@/core/models/bot.related.type";

export enum EBotLogType {
    Info = "info",
    Success = "success",
    Error = "error",
}

export interface ILogMessageStack {
    message: string;
    log_type: EBotLogType;
    log_date: Date;
}

export interface Interface extends IBaseModel {
    bot_uid: string;
    log_type: EBotLogType;
    message_stack: ILogMessageStack[];
    filterable_table?: TBotRelatedTargetTable;
    filterable_uid?: string;
    updated_at: Date;
}

class BotLogModel extends BaseModel<Interface> {
    public static get MODEL_NAME() {
        return "BotLogModel" as const;
    }

    public static convertModel(model: Interface): Interface {
        if (Utils.Type.isString(model.log_type)) {
            model.log_type = Utils.String.convertSafeEnum(EBotLogType, model.log_type);
        }

        if (Utils.Type.isArray(model.message_stack)) {
            model.message_stack = model.message_stack.map((stack) => {
                stack.log_type = Utils.String.convertSafeEnum(EBotLogType, stack.log_type);
                if (Utils.Type.isString(stack.log_date)) {
                    stack.log_date = new Date(stack.log_date);
                }
                return stack;
            });
        }

        if (Utils.Type.isString(model.updated_at)) {
            model.updated_at = new Date(model.updated_at);
        }

        return model;
    }

    public get bot_uid() {
        return this.getValue("bot_uid");
    }
    public set bot_uid(value) {
        this.update({ bot_uid: value });
    }

    public get log_type() {
        return this.getValue("log_type");
    }
    public set log_type(value) {
        this.update({ log_type: value });
    }

    public get message_stack() {
        return this.getValue("message_stack");
    }
    public set message_stack(value) {
        this.update({ message_stack: value });
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

    public get updated_at(): Date {
        return this.getValue("updated_at");
    }
    public set updated_at(value: string | Date) {
        this.update({ updated_at: new Date(value) });
    }

    public getBadgeVariant(logType?: EBotLogType) {
        switch (logType ?? this.log_type) {
            case EBotLogType.Info:
                return "default";
            case EBotLogType.Success:
                return "success";
            case EBotLogType.Error:
                return "destructive";
            default:
                return "secondary";
        }
    }
}

registerModel(BotLogModel);

export const Model = BotLogModel;
export type TModel = BotLogModel;
