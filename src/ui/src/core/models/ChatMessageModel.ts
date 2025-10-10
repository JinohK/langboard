import { BaseModel, IBaseModel, IChatContent } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import { Utils } from "@langboard/core/utils";

export interface Interface extends IBaseModel {
    chat_session_uid: string;
    message: IChatContent;
    is_received: bool;
    updated_at: Date;

    // variable set from the client side
    isPending?: bool;
}

class ChatMessageModel extends BaseModel<Interface> {
    public static get MODEL_NAME() {
        return "ChatMessageModel" as const;
    }

    public static convertModel(model: Interface): Interface {
        if (Utils.Type.isString(model.updated_at)) {
            model.updated_at = new Date(model.updated_at);
        }
        return model;
    }

    public get chat_session_uid() {
        return this.getValue("chat_session_uid");
    }
    public set chat_session_uid(value) {
        this.update({ chat_session_uid: value });
    }

    public get message() {
        return this.getValue("message");
    }
    public set message(value) {
        this.update({ message: value });
    }

    public get updated_at(): Date {
        return this.getValue("updated_at");
    }
    public set updated_at(value: string | Date) {
        this.update({ updated_at: new Date(value) });
    }

    public get is_received() {
        return this.getValue("is_received");
    }
    public set is_received(value) {
        this.update({ is_received: value });
    }

    public get isPending() {
        return this.getValue("isPending");
    }
    public set isPending(value) {
        this.update({ isPending: value });
    }
}

registerModel(ChatMessageModel);

export const Model = ChatMessageModel;
export type TModel = ChatMessageModel;
