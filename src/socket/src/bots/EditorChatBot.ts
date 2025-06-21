/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseBot, { registerBot } from "@/core/ai/BaseBot";
import SnowflakeID from "@/core/db/SnowflakeID";
import { EInternalBotType } from "@/models/InternalBotSetting";
import formidable from "formidable";

class EditorChatBot extends BaseBot {
    static get BOT_TYPE(): EInternalBotType {
        return EInternalBotType.EditorChat;
    }
    static get BOT_AVATAR(): string | null {
        return null;
    }

    public async run(data: Record<string, any>) {
        return await this.runLangflow(
            {
                message: (data.messages as any[]).map((message) => `${message.role}: ${message.content}`).join("\n"),
                projectUID: data.project_uid,
                userId: data.user_id,
                tweaks: { Prompt: { prompt: data.system } },
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            true
        );
    }

    public async runAbortable(data: Record<string, any>, taskID: string) {
        return await this.runLangflowAbortable(
            taskID,
            {
                message: (data.messages as any[]).map((message) => `${message.role}: ${message.content}`).join("\n"),
                projectUID: data.project_uid,
                userId: data.user_id,
                tweaks: { Prompt: { prompt: data.system } },
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            true
        );
    }

    public async isAvailable() {
        return await this.isLangflowAvailable();
    }

    public async uploadFile(file: formidable.File): Promise<string | null> {
        return await this.uploadFileToLangflow(file);
    }
}

registerBot(EditorChatBot);

export default EditorChatBot;
