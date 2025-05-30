/* eslint-disable @typescript-eslint/no-explicit-any */
import useAppSettingDeletedHandlers from "@/controllers/socket/settings/useAppSettingDeletedHandlers";
import useAppSettingUpdatedHandlers from "@/controllers/socket/settings/useAppSettingUpdatedHandlers";
import { BaseModel, IBaseModel } from "@/core/models/Base";
import { StringCase } from "@/core/utils/StringUtils";
import TypeUtils from "@/core/utils/TypeUtils";

export enum ESettingType {
    ApiKey = "api_key",
    LangflowUrl = "langflow_url",
    LangflowApiKey = "langflow_api_key",
    WebhookUrl = "webhook_url",
}

export interface Interface extends IBaseModel {
    setting_type: ESettingType;
    setting_name: string;
    setting_value: any;
    created_at: Date;
    last_used_at: Date;
    total_used_count: number;
}

class AppSettingModel extends BaseModel<Interface> {
    static get MODEL_NAME() {
        return "AppSettingModel" as const;
    }

    constructor(model: Record<string, unknown>) {
        super(model);

        this.subscribeSocketEvents([useAppSettingUpdatedHandlers, useAppSettingDeletedHandlers], {
            setting: this,
        });
    }

    public static convertModel(model: Interface): Interface {
        if (model.setting_type) {
            if (TypeUtils.isString(model.setting_type)) {
                model.setting_type = ESettingType[new StringCase(model.setting_type).toPascal() as keyof typeof ESettingType];
            }
        }
        if (TypeUtils.isString(model.created_at)) {
            model.created_at = new Date(model.created_at);
        }
        if (TypeUtils.isString(model.last_used_at)) {
            model.last_used_at = new Date(model.last_used_at);
        }
        return model;
    }

    public get setting_type() {
        return this.getValue("setting_type");
    }
    public set setting_type(value: ESettingType) {
        this.update({ setting_type: value });
    }

    public get setting_name() {
        return this.getValue("setting_name");
    }
    public set setting_name(value: string) {
        this.update({ setting_name: value });
    }

    public get setting_value() {
        return this.getValue("setting_value");
    }
    public set setting_value(value: any) {
        this.update({ setting_value: value });
    }

    public get created_at() {
        return this.getValue("created_at");
    }
    public set created_at(value: string | Date) {
        this.update({ created_at: value });
    }

    public get last_used_at() {
        return this.getValue("last_used_at");
    }
    public set last_used_at(value: string | Date) {
        this.update({ last_used_at: value });
    }

    public get total_used_count() {
        return this.getValue("total_used_count");
    }
    public set total_used_count(value: number) {
        this.update({ total_used_count: value });
    }
}

export const Model = AppSettingModel;
export type TModel = AppSettingModel;
