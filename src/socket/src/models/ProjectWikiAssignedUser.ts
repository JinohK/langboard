import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import { Entity } from "typeorm";

@Entity({ name: "project_wiki_assigned_user" })
class ProjectWikiAssignedUser extends BaseModel {
    @BigIntColumn(false)
    public project_assigned_id!: TBigIntString;

    @BigIntColumn(false)
    public project_wiki_id!: TBigIntString;

    @BigIntColumn(false)
    public user_id!: TBigIntString;
}

export default ProjectWikiAssignedUser;
