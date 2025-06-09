import BaseModel, { BigIntColumn, IEditorContentModel, TBigIntString } from "@/core/db/BaseModel";
import { getDatetimeType } from "@/core/db/DbType";
import { Entity, Column } from "typeorm";

@Entity({ name: "card" })
class Card extends BaseModel {
    @BigIntColumn(false)
    public project_id!: TBigIntString;

    @BigIntColumn(false)
    public project_column_id!: TBigIntString;

    @Column({ type: "varchar" })
    public title!: string;

    @Column({ type: "json" })
    public description: IEditorContentModel = { content: "" };

    @Column({ type: "text" })
    public ai_description!: string;

    @Column({ type: getDatetimeType(), nullable: true, default: null })
    public deadline_at: Date | null = null;

    @Column({ type: "integer" })
    public order!: number;

    @Column({ type: getDatetimeType(), nullable: true, default: null })
    public archived_at: Date | null = null;
}

export default Card;
