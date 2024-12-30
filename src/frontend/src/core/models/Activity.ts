import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    activity: {
        shared: Record<string, unknown>;
        old: Record<string, unknown> | null;
        new: Record<string, unknown>;
    };
    activity_type: string;
}

class Activity extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "Activity" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);
    }

    public get activity() {
        return this.getValue("activity");
    }
    public set activity(value: Interface["activity"]) {
        this.update({ activity: value });
    }

    public get activity_type() {
        return this.getValue("activity_type");
    }
    public set activity_type(value: string) {
        this.update({ activity_type: value });
    }
}

registerModel(Activity);

export type TModel = Activity;
export const Model = Activity;
