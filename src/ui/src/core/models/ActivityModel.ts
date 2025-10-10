/* eslint-disable @typescript-eslint/no-explicit-any */
import { TProjectRelatedActivityInterface } from "@/core/models/activities/merged.type";
import { TProjectWikiActivityInterface } from "@/core/models/activities/project.wiki.activity.type";
import { TUserActivityInterface } from "@/core/models/activities/user.activity.type";
import { BaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";

export type TActivity = TUserActivityInterface | TProjectRelatedActivityInterface | TProjectWikiActivityInterface;

export class ActivityModel extends BaseModel<TActivity> {
    public static get MODEL_NAME() {
        return "ActivityModel" as const;
    }

    public static convertModel(model: any): any {
        if (Utils.Type.isString(model.created_at)) {
            model.created_at = new Date(model.created_at);
        }
        return model;
    }

    public get activity_type() {
        return this.getValue("activity_type");
    }
    public set activity_type(value) {
        this.update({ activity_type: value });
    }

    public get activity_history() {
        return this.getValue("activity_history");
    }
    public set activity_history(value) {
        this.update({ activity_history: value });
    }

    public get filterable_map() {
        return this.getValue("filterable_map");
    }
    public set filterable_map(value) {
        this.update({ filterable_map: value });
    }

    public get refer() {
        return this.getValue("refer");
    }
    public set refer(value) {
        this.update({ refer: value });
    }

    public get references() {
        return this.getValue("references");
    }
    public set references(value) {
        this.update({ references: value });
    }

    public get created_at(): Date {
        return this.getValue("created_at");
    }
    public set created_at(value: string | Date) {
        this.update({ created_at: new Date(value) });
    }
}

registerModel(ActivityModel);

export const Model = ActivityModel;
export type TModel = ActivityModel;
