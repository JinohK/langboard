import * as User from "@/core/models/User";
import { BaseModel, IBaseModel, registerModel } from "@/core/models/Base";
import { convertServerFileURL } from "@/core/utils/StringUtils";
import useBotUpdatedHandlers from "@/controllers/socket/global/useBotUpdatedHandlers";
import useBotDeletedHandlers from "@/controllers/socket/global/useBotDeletedHandlers";
import { EBotTriggerCondition } from "@/core/models/bot.type";

export enum EAPIAuthType {
    Basic = "basic",
    Bearer = "bearer",
    Langflow = "langflow",
    OpenAI = "openai",
}

export interface Interface extends IBaseModel {
    name: string;
    bot_uname: string;
    avatar?: string;
    as_user: User.Interface;
    api_url: string;
    api_auth_type: EAPIAuthType;
    api_key: string;
    app_api_token: string;
    ip_whitelist: string[];
    prompt: string;
    conditions: Partial<Record<EBotTriggerCondition, { is_predefined: bool }>>;
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

    public get api_url() {
        return this.getValue("api_url");
    }
    public set api_url(value: string) {
        this.update({ api_url: value });
    }

    public get api_auth_type() {
        return this.getValue("api_auth_type");
    }
    public set api_auth_type(value: EAPIAuthType) {
        this.update({ api_auth_type: value });
    }

    public get api_key() {
        return this.getValue("api_key");
    }
    public set api_key(value: string) {
        this.update({ api_key: value });
    }

    public get app_api_token() {
        return this.getValue("app_api_token");
    }
    public set app_api_token(value: string) {
        this.update({ app_api_token: value });
    }

    public get ip_whitelist() {
        return this.getValue("ip_whitelist");
    }
    public set ip_whitelist(value: string[]) {
        this.update({ ip_whitelist: value });
    }

    public get prompt() {
        return this.getValue("prompt");
    }
    public set prompt(value: string) {
        this.update({ prompt: value });
    }

    public get conditions() {
        return this.getValue("conditions");
    }
    public set conditions(value: Partial<Record<EBotTriggerCondition, { is_predefined: bool }>>) {
        this.update({ conditions: value });
    }
}

registerModel(BotModel);

export const Model = BotModel;
export type TModel = BotModel;
