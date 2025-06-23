import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import { Entity } from "typeorm";

@Entity({ name: "project_assigned_internal_bot" })
class ProjectAssignedInternalBot extends BaseModel {
    @BigIntColumn(false)
    public project_id!: TBigIntString;

    @BigIntColumn(false)
    public internal_bot_id!: TBigIntString;

    public static async getInternalBotByProjectUID(botType: EInternalBotType, projectUID: string): Promise<InternalBot | null> {
        const projectId = SnowflakeID.fromShortCode(projectUID).toString();
        const internalBot = await InternalBot.createQueryBuilder("ib")
            .innerJoin(ProjectAssignedInternalBot, "pa", "pa.internal_bot_id = ib.id")
            .select(InternalBot.getSelectAllQuery("ib"))
            .where("pa.project_id = :projectId", { projectId })
            .andWhere("ib.bot_type = :botType", { botType })
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

export default ProjectAssignedInternalBot;
