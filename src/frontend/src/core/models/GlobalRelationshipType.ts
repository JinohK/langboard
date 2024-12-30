import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";

export interface Interface extends IBaseModel {
    parent_icon?: string;
    parent_name: string;
    child_icon?: string;
    child_name: string;
    description: string;
}

class GlobalRelationshipType extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "GlobalRelationshipType" as const;
    }
    get MODEL_NAME() {
        return GlobalRelationshipType.MODEL_NAME;
    }

    public get parent_icon() {
        return this.getValue("parent_icon");
    }
    public set parent_icon(value: string | undefined) {
        this.update({ parent_icon: value });
    }

    public get parent_name() {
        return this.getValue("parent_name");
    }
    public set parent_name(value: string) {
        this.update({ parent_name: value });
    }

    public get child_icon() {
        return this.getValue("child_icon");
    }
    public set child_icon(value: string | undefined) {
        this.update({ child_icon: value });
    }

    public get child_name() {
        return this.getValue("child_name");
    }
    public set child_name(value: string) {
        this.update({ child_name: value });
    }

    public get description() {
        return this.getValue("description");
    }
    public set description(value: string) {
        this.update({ description: value });
    }
}

registerModel(GlobalRelationshipType);

export type TModel = GlobalRelationshipType;
export const Model = GlobalRelationshipType;
