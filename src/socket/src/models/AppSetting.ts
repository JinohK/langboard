import BaseModel from "@/core/db/BaseModel";
import { Entity, Column } from "typeorm";

export enum EAppSettingType {
    ApiKey = "api_key",
    WebhookUrl = "webhook_url",
}

@Entity({ name: "app_setting" })
class AppSetting extends BaseModel {
    @Column({ type: "varchar", enum: EAppSettingType })
    public setting_type!: EAppSettingType;

    @Column({ type: "text" })
    public setting_value!: string;
}

export default AppSetting;
