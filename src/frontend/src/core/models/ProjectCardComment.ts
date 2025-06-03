import { TEmoji } from "@/components/base/AnimatedEmoji/emojis";
import * as BotModel from "@/core/models/BotModel";
import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, IEditorContent } from "@/core/models/Base";
import { registerModel } from "@/core/models/ModelRegistry";
import TypeUtils from "@/core/utils/TypeUtils";

export interface Interface extends IBaseModel {
    card_uid: string;
    content: IEditorContent;
    is_edited: bool;
    commented_at: Date;
}

export interface IStore extends Interface {
    user?: User.Interface;
    bot?: BotModel.Interface;
    reactions: Partial<Record<TEmoji, string[]>>;
}

class ProjectCardComment extends BaseModel<IStore> {
    static get FOREIGN_MODELS() {
        return {
            user: User.Model.MODEL_NAME,
            bot: BotModel.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "ProjectCardComment" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);
    }

    public static convertModel(model: Interface): Interface {
        if (TypeUtils.isString(model.commented_at)) {
            model.commented_at = new Date(model.commented_at);
        }
        return model;
    }

    public get card_uid() {
        return this.getValue("card_uid");
    }
    public set card_uid(value: string) {
        this.update({ card_uid: value });
    }

    public get content() {
        return this.getValue("content");
    }
    public set content(value: IEditorContent) {
        this.update({ content: value });
    }

    public get is_edited() {
        return this.getValue("is_edited");
    }
    public set is_edited(value: bool) {
        this.update({ is_edited: value });
    }

    public get commented_at(): Date {
        return this.getValue("commented_at");
    }
    public set commented_at(value: string | Date) {
        this.update({ commented_at: value });
    }

    public get user(): User.TModel | undefined {
        return this.getForeignModels<User.TModel>("user")[0];
    }
    public set user(value: User.TModel | User.Interface) {
        this.update({ user: value });
    }

    public get bot(): BotModel.TModel | undefined {
        return this.getForeignModels<BotModel.TModel>("bot")[0];
    }
    public set bot(value: BotModel.TModel | BotModel.Interface) {
        this.update({ bot: value });
    }

    public get reactions() {
        return this.getValue("reactions");
    }
    public set reactions(value: Partial<Record<TEmoji, string[]>>) {
        this.update({ reactions: value });
    }
}

registerModel(ProjectCardComment);

export type TModel = ProjectCardComment;
export const Model = ProjectCardComment;
