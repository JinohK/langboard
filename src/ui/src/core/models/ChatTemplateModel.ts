import useBoardChatTemplateDeletedHandlers from "@/controllers/socket/board/chat/useBoardChatTemplateDeletedHandlers";
import useBoardChatTemplateUpdatedHandlers from "@/controllers/socket/board/chat/useBoardChatTemplateUpdatedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";

export interface Interface extends IBaseModel {
    filterable_table: "project";
    filterable_uid: string;
    name: string;
    template: string;
}

class ChatTemplateModel extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "ChatTemplateModel" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        if (this.filterable_table === "project") {
            this.subscribeSocketEvents([useBoardChatTemplateUpdatedHandlers, useBoardChatTemplateDeletedHandlers], {
                projectUID: this.filterable_uid,
                template: this,
            });
        }
    }

    public get filterable_table() {
        return this.getValue("filterable_table");
    }
    public set filterable_table(value: Interface["filterable_table"]) {
        this.update({ filterable_table: value });
    }

    public get filterable_uid() {
        return this.getValue("filterable_uid");
    }
    public set filterable_uid(value: string) {
        this.update({ filterable_uid: value });
    }

    public get name() {
        return this.getValue("name");
    }
    public set name(value: string) {
        this.update({ name: value });
    }

    public get template() {
        return this.getValue("template");
    }
    public set template(value: string) {
        this.update({ template: value });
    }
}

registerModel(ChatTemplateModel);

export const Model = ChatTemplateModel;
export type TModel = ChatTemplateModel;
