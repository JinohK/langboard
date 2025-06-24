import useCardAttachmentNameChangedHandlers from "@/controllers/socket/card/attachment/useCardAttachmentNameChangedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import * as User from "@/core/models/User";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends IBaseModel {
    card_uid: string;
    name: string;
    url: string;
    order: number;
    created_at: Date;
}

export interface IStore extends Interface {
    user: User.Interface;
}

class ProjectCardAttachment extends BaseModel<IStore> {
    static override get FOREIGN_MODELS() {
        return {
            user: User.Model.MODEL_NAME,
        };
    }
    override get FOREIGN_MODELS() {
        return ProjectCardAttachment.FOREIGN_MODELS;
    }
    static get MODEL_NAME() {
        return "ProjectCardAttachment" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);
        this.subscribeSocketEvents([useCardAttachmentNameChangedHandlers], {
            cardUID: this.card_uid,
            attachmentUID: this.uid,
        });
    }

    public static convertModel(model: Interface): Interface {
        if (model.url) {
            model.url = convertServerFileURL(model.url);
        }
        if (TypeUtils.isString(model.created_at)) {
            model.created_at = new Date(model.created_at);
        }
        return model;
    }

    public get card_uid() {
        return this.getValue("card_uid");
    }
    public set card_uid(value) {
        this.update({ card_uid: value });
    }

    public get name() {
        return this.getValue("name");
    }
    public set name(value) {
        this.update({ name: value });
    }

    public get url() {
        return this.getValue("url");
    }
    public set url(value) {
        this.update({ url: value });
    }

    public get order() {
        return this.getValue("order");
    }
    public set order(value) {
        this.update({ order: value });
    }

    public get created_at(): Date {
        return this.getValue("created_at");
    }
    public set created_at(value: string | Date) {
        this.update({ created_at: new Date(value) });
    }

    public get user(): User.TModel {
        return this.getForeignValue("user")[0];
    }
    public set user(value: User.TModel | User.Interface) {
        this.update({ user: value });
    }
}

registerModel(ProjectCardAttachment);

export type TModel = ProjectCardAttachment;
export const Model = ProjectCardAttachment;
