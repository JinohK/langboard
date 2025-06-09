import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import { Entity, Column } from "typeorm";

interface IChatContentModel {
    content: string;
}

@Entity({ name: "chat_history" })
class ChatHistory extends BaseModel {
    @Column({ type: "varchar" })
    public filterable_table!: string;

    @BigIntColumn(false)
    public filterable_id!: TBigIntString;

    @BigIntColumn(false)
    public sender_id: TBigIntString | null = null;

    @BigIntColumn(false)
    public receiver_id: TBigIntString | null = null;

    @Column({ type: "json" })
    public message: IChatContentModel = { content: "" };

    public get apiResponse() {
        return {
            uid: this.uid,
            filterable_table: this.filterable_table,
            filterable_uid: new SnowflakeID(this.filterable_id).toShortCode(),
            sender_uid: this.sender_id ? new SnowflakeID(this.sender_id).toShortCode() : undefined,
            receiver_uid: this.receiver_id ? new SnowflakeID(this.receiver_id).toShortCode() : undefined,
            message: this.message,
            updated_at: this.updated_at,
        };
    }
}

export default ChatHistory;
