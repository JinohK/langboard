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

@Entity({ name: "internal_bot" })
class InternalBot extends BaseModel {
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

    public static getSelectAllQuery(alias?: string): string[] {
        const prefix = alias ? `${alias}.` : "";
        return [
            `cast(${prefix}id as text) as converted_id`,
            `${prefix}bot_type as bot_type`,
            `${prefix}display_name as display_name`,
            `${prefix}platform as platform`,
            `${prefix}platform_running_type as platform_running_type`,
            `${prefix}url as url`,
            `${prefix}api_key as api_key`,
            `CASE WHEN ${prefix}platform_running_type = '${EInternalBotPlatformRunningType.FlowJson}' THEN NULL ELSE ${prefix}value END as value`,
            `${prefix}avatar as avatar`,
            `${prefix}created_at as created_at`,
            `${prefix}updated_at as updated_at`,
        ];
    }

    public static async findByType(type: EInternalBotType): Promise<InternalBot | null> {
        const internalBot = await InternalBot.createQueryBuilder()
            .select(InternalBot.getSelectAllQuery())
            .where("bot_type = :type", { type })
            .getRawOne();

        if (!internalBot) {
            return null;
        }

        internalBot.id = internalBot.converted_id;

        return InternalBot.create({
            ...internalBot,
        });
    }
}

export default InternalBot;
