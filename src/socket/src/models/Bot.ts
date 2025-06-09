import BaseModel from "@/core/db/BaseModel";
import { Entity, Column } from "typeorm";

@Entity({ name: "bot" })
class Bot extends BaseModel {
    @Column({ type: "varchar" })
    public name!: string;

    @Column({ type: "varchar" })
    public bot_uname!: string;

    @Column({ type: "json", nullable: true })
    public avatar: Record<string, unknown> | null = null;
}

export default Bot;
