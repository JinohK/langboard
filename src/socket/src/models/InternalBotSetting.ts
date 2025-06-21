import BaseModel from "@/core/db/BaseModel";
import { Entity, Column } from "typeorm";

export enum EInternalBotType {
    ProjectChat = "project_chat",
    EditorChat = "editor_chat",
    EditorCopilot = "editor_copilot",
}

export enum EInternalBotPlatform {
    Langflow = "langflow",
}

export enum EInternalBotPlatformRunningType {
    FlowId = "flow_id",
    FlowJson = "flow_json",
}

@Entity({ name: "internal_bot_setting" })
class InternalBotSetting extends BaseModel {
    @Column({ type: "varchar", enum: EInternalBotType })
    public bot_type!: EInternalBotType;

    @Column({ type: "varchar" })
    public display_name!: string;

    @Column({ type: "varchar", enum: EInternalBotPlatform })
    public platform!: EInternalBotPlatform;

    @Column({ type: "varchar", enum: EInternalBotPlatformRunningType })
    public platform_running_type!: EInternalBotPlatformRunningType;

    @Column({ type: "varchar" })
    public url!: string;

    @Column({ type: "varchar" })
    public api_key: string = "";

    @Column({ type: "varchar" })
    public value?: string;

    @Column({ type: "json", nullable: true })
    public avatar: Record<string, unknown> | null = null;

    public get apiResponse() {
        return {
            uid: this.uid,
            bot_type: this.bot_type,
            display_name: this.display_name,
            avatar: this.avatar?.path ?? null,
        };
    }

    public static async findByType(type: EInternalBotType): Promise<InternalBotSetting | null> {
        const internalBotSetting = await InternalBotSetting.createQueryBuilder()
            .select([
                "cast(id as text) as converted_id",
                "bot_type",
                "display_name",
                "platform",
                "platform_running_type",
                "url",
                "api_key",
                `CASE WHEN platform_running_type = '${EInternalBotPlatformRunningType.FlowJson}' THEN NULL ELSE value END as value`,
                "avatar",
                "created_at",
                "updated_at",
            ])
            .where("bot_type = :type", { type })
            .getRawOne();

        if (!internalBotSetting) {
            return null;
        }

        internalBotSetting.id = internalBotSetting.converted_id;

        return InternalBotSetting.create({
            ...internalBotSetting,
        });
    }
}

export default InternalBotSetting;
