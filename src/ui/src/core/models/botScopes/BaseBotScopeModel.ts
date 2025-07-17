import { BaseModel, IBaseModel } from "@/core/models/Base";
import { EBotTriggerCondition } from "@/core/models/botScopes/EBotTriggerCondition";
import { Utils } from "@langboard/core/utils";

export interface Interface extends IBaseModel {
    bot_uid: string;
    conditions: EBotTriggerCondition[];
}

abstract class BaseBotScopeModel<TModel extends Interface> extends BaseModel<TModel> {
    public static convertModel(model: Interface): Interface {
        if (Utils.Type.isArray(model.conditions)) {
            model.conditions = model.conditions.map((condition) => {
                return Utils.String.convertSafeEnum(EBotTriggerCondition, condition);
            });
        }

        return model;
    }

    public get bot_uid() {
        return this.getValue("bot_uid");
    }
    public set bot_uid(value) {
        this.update({ bot_uid: value });
    }

    public get conditions() {
        return this.getValue("conditions");
    }
    public set conditions(value) {
        this.update({ conditions: value });
    }
}

export const Model = BaseBotScopeModel;
export type TModel = BaseBotScopeModel<Interface>;
