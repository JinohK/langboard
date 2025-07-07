import { IBaseModel, BaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";

export type TType = "card" | "project_wiki";

export interface Interface extends IBaseModel {
    type: TType;
    metadata: Record<string, string>;
}

class MetadataModel extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "MetadataModel" as const;
    }

    public get type() {
        return this.getValue("type");
    }
    public set type(value) {
        this.update({ type: value });
    }

    public get metadata() {
        return this.getValue("metadata");
    }
    public set metadata(value) {
        this.update({ metadata: value });
    }
}

registerModel(MetadataModel);

export type TModel = MetadataModel;
export const Model = MetadataModel;
