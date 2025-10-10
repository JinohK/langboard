import BaseModel, { BigIntColumn, TBigIntString } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import { Entity, Column } from "typeorm";

interface IChatContentModel {
    content: string;
}

@Entity({ name: "chat_history" })
class ChatHistory extends BaseModel {
    @BigIntColumn(false)
    public chat_session_id!: TBigIntString;

    @Column({ type: "json" })
    public message: IChatContentModel = { content: "" };

    @Column({ type: "boolean" })
    public is_received!: bool;

    public get apiResponse() {
        return {
            uid: this.uid,
            chat_session_uid: new SnowflakeID(this.chat_session_id).toShortCode(),
            message: this.message,
            is_received: this.is_received,
            updated_at: this.updated_at,
        };
    }
}

export default ChatHistory;
