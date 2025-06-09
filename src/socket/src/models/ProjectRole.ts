import BaseModel, { BigIntColumn, ROLE_ALL_GRANTED, TBigIntString, TRoleAllGranted } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import { Entity, Column } from "typeorm";

export enum EProjectRoleAction {
    Read = "read",
    Update = "update",
    CardWrite = "card_write",
    CardUpdate = "card_update",
    CardDelete = "card_delete",
}
export type TProjectRoleActions = EProjectRoleAction | keyof typeof EProjectRoleAction | TRoleAllGranted;

@Entity({ name: "project_role" })
class ProjectRole extends BaseModel {
    @BigIntColumn(false)
    public user_id!: TBigIntString | null;

    @BigIntColumn(false)
    public bot_id!: TBigIntString | null;

    @BigIntColumn(false)
    public project_id!: TBigIntString;

    @Column({ type: "text", transformer: { to: (value: TProjectRoleActions[]) => value.join(","), from: (value: string) => value.split(",") } })
    public actions!: TProjectRoleActions[];

    public static async isGranted(userId: TBigIntString, projectUID: string, action: TProjectRoleActions): Promise<bool> {
        const projectId = SnowflakeID.fromShortCode(projectUID).toString();
        const projectRole = await this.findOne({
            where: {
                user_id: userId,
                project_id: projectId,
            },
        });

        if (!projectRole) {
            return false;
        }

        if (projectRole.actions.includes(ROLE_ALL_GRANTED)) {
            return true;
        }

        return projectRole.actions.includes(action);
    }
}

export default ProjectRole;
