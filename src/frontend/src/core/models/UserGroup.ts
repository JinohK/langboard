import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import * as User from "@/core/models/User";

export interface Interface extends IBaseModel {
    name: string;
    users: User.Interface[];
}

class UserGroup extends BaseModel<Interface> {
    static get FOREIGN_MODELS() {
        return {
            users: User.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "UserGroup" as const;
    }

    public get name() {
        return this.getValue("name");
    }
    public set name(value: string) {
        this.update({ name: value });
    }

    public get users(): User.TModel[] {
        return this.getForeignModels("users");
    }
    public set users(value: (User.TModel | User.Interface)[]) {
        this.update({ users: value });
    }
}

registerModel(UserGroup);

export type TModel = UserGroup;
export const Model = UserGroup;
