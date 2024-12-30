import * as User from "@/core/models/User";
import * as UserGroup from "@/core/models/UserGroup";

export interface Interface extends User.Interface {
    is_admin?: bool;
    industry: string;
    purpose: string;
    affiliation?: string;
    position?: string;
    user_groups: { uid: string; name: string; users: User.TModel[] }[];
    subemails: { email: string; verified_at: string }[];
}

class AuthUser extends User.Model<Interface> {
    static get FOREIGN_MODELS() {
        return {
            user_groups: UserGroup.Model.MODEL_NAME,
        };
    }

    public get is_admin() {
        return this.getValue("is_admin");
    }
    public set is_admin(value: bool | undefined) {
        this.update({ is_admin: value });
    }

    public get industry() {
        return this.getValue("industry");
    }
    public set industry(value: string) {
        this.update({ industry: value });
    }

    public get purpose() {
        return this.getValue("purpose");
    }
    public set purpose(value: string) {
        this.update({ purpose: value });
    }

    public get affiliation() {
        return this.getValue("affiliation");
    }
    public set affiliation(value: string | undefined) {
        this.update({ affiliation: value });
    }

    public get position() {
        return this.getValue("position");
    }
    public set position(value: string | undefined) {
        this.update({ position: value });
    }

    public get user_groups(): UserGroup.TModel[] {
        return this.getForeignModels("user_groups");
    }
    public set user_groups(value: (UserGroup.TModel | UserGroup.Interface)[]) {
        this.update({ user_groups: value });
    }

    public get subemails() {
        return this.getValue("subemails");
    }
    public set subemails(value: { email: string; verified_at: string }[]) {
        this.update({ subemails: value });
    }
}

export const Model = AuthUser;
export type TModel = AuthUser;
