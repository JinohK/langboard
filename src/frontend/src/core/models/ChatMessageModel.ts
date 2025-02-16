import { BaseModel, IBaseModel, IChatContent, registerModel } from "@/core/models/Base";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends IBaseModel {
    icon?: string;
    sender_uid?: string;
    receiver_uid?: string;
    message: IChatContent;
    updated_at: Date;

    // variable set from the client side
    projectUID: string;
    isReceived: bool;
    isPending?: bool;
}

class ChatMessageModel extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "ChatMessageModel" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);
    }

    public static convertModel(model: Interface): Interface {
        if (TypeUtils.isString(model.updated_at)) {
            model.updated_at = new Date(model.updated_at);
        }
        if (!model.sender_uid) {
            model.isReceived = true;
        }
        return model;
    }

    public get projectUID() {
        return this.getValue("projectUID");
    }
    public set projectUID(value: string) {
        this.update({ projectUID: value });
    }

    public get icon() {
        return this.getValue("icon");
    }
    public set icon(value: string | undefined) {
        this.update({ icon: value });
    }

    public get sender_uid() {
        return this.getValue("sender_uid");
    }
    public set sender_uid(value: string | undefined) {
        this.update({ sender_uid: value });
    }

    public get receiver_uid() {
        return this.getValue("receiver_uid");
    }
    public set receiver_uid(value: string | undefined) {
        this.update({ receiver_uid: value });
    }

    public get message() {
        return this.getValue("message");
    }
    public set message(value: IChatContent) {
        this.update({ message: value });
    }

    public get updated_at(): Date {
        return this.getValue("updated_at");
    }
    public set updated_at(value: string | Date) {
        this.update({ updated_at: value });
    }

    public get isReceived() {
        return this.getValue("isReceived");
    }
    public set isReceived(value: bool) {
        this.update({ isReceived: value });
    }

    public get isPending() {
        return this.getValue("isPending");
    }
    public set isPending(value: bool | undefined) {
        this.update({ isPending: value });
    }
}

registerModel(ChatMessageModel);

export const Model = ChatMessageModel;
export type TModel = ChatMessageModel;
