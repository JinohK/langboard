import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import { Entity, Column } from "typeorm";

@Entity({ name: "project_assigned_bot" })
class ProjectAssignedBot extends BaseModel {
    @BigIntColumn(false)
    public project_id!: TBigIntString;

    @BigIntColumn(false)
    public bot_id!: TBigIntString;

    @Column({ type: "boolean" })
    public is_disabled: bool = false;

    public static async isAssigned(botUID: string, projectUID: string): Promise<bool> {
        const botId = SnowflakeID.fromShortCode(botUID).toString();
        const projectId = SnowflakeID.fromShortCode(projectUID).toString();
        const result = await ProjectAssignedBot.createQueryBuilder("pa")
            .where("pa.project_id = :projectId", { projectId })
            .andWhere("pa.bot_id = :botId", { botId })
            .limit(1)
            .getCount();

        return result > 0;
    }
}

export default ProjectAssignedBot;
