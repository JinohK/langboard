import useGlobalRelationshipDeletedHandlers from "@/controllers/socket/global/useGlobalRelationshipDeletedHandlers";
import useGlobalRelationshipUpdatedHandlers from "@/controllers/socket/global/useGlobalRelationshipUpdatedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";

export interface Interface extends IBaseModel {
    parent_name: string;
    child_name: string;
    description: string;
}

class GlobalRelationshipType extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "GlobalRelationshipType" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useGlobalRelationshipUpdatedHandlers, useGlobalRelationshipDeletedHandlers], {
            globalRelationship: this,
        });
    }

    public get parent_name() {
        return this.getValue("parent_name");
    }
    public set parent_name(value) {
        this.update({ parent_name: value });
    }

    public get child_name() {
        return this.getValue("child_name");
    }
    public set child_name(value) {
        this.update({ child_name: value });
    }

    public get description() {
        return this.getValue("description");
    }
    public set description(value) {
        this.update({ description: value });
    }
}

registerModel(GlobalRelationshipType);

export type TModel = GlobalRelationshipType;
export const Model = GlobalRelationshipType;
