/* eslint-disable @typescript-eslint/no-explicit-any */
import { TProjectRelatedActivityInterface } from "@/core/models/activities/merged.type";
import { TProjectWikiActivityInterface } from "@/core/models/activities/project.wiki.activity.type";
import { TUserActivityInterface } from "@/core/models/activities/user.activity.type";
import { BaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import TypeUtils from "@/core/utils/TypeUtils";

export type TActivity = TUserActivityInterface | TProjectRelatedActivityInterface | TProjectWikiActivityInterface;

export class ActivityModel extends BaseModel<TActivity> {
    static get MODEL_NAME() {
        return "ActivityModel" as const;
    }

    public static convertModel(model: any): any {
        if (TypeUtils.isString(model.created_at)) {
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

    public get filterable_type() {
        return this.getValue("filterable_type");
    }
    public set filterable_type(value) {
        this.update({ filterable_type: value });
    }

    public get filterable_uid() {
        return this.getValue("filterable_uid");
    }
    public set filterable_uid(value) {
        this.update({ filterable_uid: value });
    }

    public get sub_filterable_type() {
        return this.getValue("sub_filterable_type");
    }
    public set sub_filterable_type(value) {
        this.update({ sub_filterable_type: value });
    }

    public get sub_filterable_uid() {
        return this.getValue("sub_filterable_uid");
    }
    public set sub_filterable_uid(value) {
        this.update({ sub_filterable_uid: value });
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
