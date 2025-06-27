import { BaseModel, IBaseModel, IChatContent } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends IBaseModel {
    filterable_table: "project";
    filterable_uid: string;
    sender_uid?: string;
    receiver_uid?: string;
    message: IChatContent;
    updated_at: Date;

    // variable set from the client side
    isReceived: bool;
    isPending?: bool;
}

class ChatMessageModel extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "ChatMessageModel" as const;
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

    public get filterable_table() {
        return this.getValue("filterable_table");
    }
    public set filterable_table(value: string) {
        this.update({ filterable_table: value });
    }

    public get filterable_uid() {
        return this.getValue("filterable_uid");
    }
    public set filterable_uid(value: string) {
        this.update({ filterable_uid: value });
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
        this.update({ updated_at: new Date(value) });
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
