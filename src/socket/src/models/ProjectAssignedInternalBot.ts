import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import { Column, Entity } from "typeorm";

export interface IProjectAssignedInternalBotSettings {
    prompt: string;
    use_default_prompt: bool;
}

@Entity({ name: "project_assigned_internal_bot" })
class ProjectAssignedInternalBot extends BaseModel {
    @BigIntColumn(false)
    public project_id!: TBigIntString;

    @BigIntColumn(false)
    public internal_bot_id!: TBigIntString;

    @Column({ type: "text" })
    public prompt!: string;

    @Column({ type: "boolean" })
    public use_default_prompt: bool = true;

    public static async getInternalBotByProjectUID(
        botType: EInternalBotType,
        projectUID: string
    ): Promise<[InternalBot, IProjectAssignedInternalBotSettings] | null> {
        const projectId = SnowflakeID.fromShortCode(projectUID).toString();
        const internalBot = await InternalBot.createQueryBuilder("ib")
            .innerJoin(ProjectAssignedInternalBot, "pa", "pa.internal_bot_id = ib.id")
            .select(InternalBot.getSelectAllQuery("ib").concat("pa.prompt as prompt", "pa.use_default_prompt as use_default_prompt"))
            .where("pa.project_id = :projectId", { projectId })
            .andWhere("ib.bot_type = :botType", { botType })
            .getRawOne();

        if (!internalBot) {
            return null;
        }

        internalBot.id = internalBot.converted_id;

        return [
            InternalBot.create({
                ...internalBot,
            }),
            {
                prompt: internalBot.prompt,
                use_default_prompt: internalBot.use_default_prompt,
            },
        ];
    }
}

export default ProjectAssignedInternalBot;
