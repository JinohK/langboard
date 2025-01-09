import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import useBotUpdatedHandlers from "@/controllers/socket/global/useBotUpdatedHandlers";
import useBotDeletedHandlers from "@/controllers/socket/global/useBotDeletedHandlers";

export interface Interface extends IBaseModel {
    name: string;
    bot_uname: string;
    avatar?: string;
    as_user: User.Interface;
}

class BotModel extends BaseModel<Interface> {
    static get FOREIGN_MODELS() {
        return {
            as_user: User.Model.MODEL_NAME,
        };
    }
    static get MODEL_NAME() {
        return "BotModel" as const;
    }

    static get BOT_UNAME_PREFIX() {
        return "bot-";
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useBotUpdatedHandlers, useBotDeletedHandlers], {
            bot: this,
        });
    }

    public static convertModel(model: Interface): Interface {
        if (model.avatar) {
            model.avatar = convertServerFileURL(model.avatar);
        }
        return model;
    }

    public get name() {
        return this.getValue("name");
    }
    public set name(value: string) {
        this.update({ name: value });
    }

    public get bot_uname() {
        return this.getValue("bot_uname");
    }
    public set bot_uname(value: string) {
        this.update({ bot_uname: value });
    }

    public get avatar() {
        return this.getValue("avatar");
    }
    public set avatar(value: string | undefined) {
        this.update({ avatar: value });
    }

    public get as_user(): User.TModel {
        return this.getForeignModels<User.TModel>("as_user")[0];
    }
    public set as_user(value: User.TModel | User.Interface) {
        this.update({ as_user: value });
    }
}

registerModel(BotModel);

export const Model = BotModel;
export type TModel = BotModel;
