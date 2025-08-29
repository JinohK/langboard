/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseBot, { registerBot } from "@/core/ai/BaseBot";
import SnowflakeID from "@/core/db/SnowflakeID";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import formidable from "formidable";

class ProjectChatBot extends BaseBot {
    public static get BOT_TYPE(): EInternalBotType {
        return EInternalBotType.ProjectChat;
    }

    public async run(internalBot: InternalBot, data: Record<string, any>) {
        return await this.request(
            internalBot,
            {
                message: data.message,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                tweaks: data.file_path ? { LangboardFile: { path: data.file_path } } : {},
                restData: data.rest_data,
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            true
        );
    }

    public async runAbortable(internalBot: InternalBot, data: Record<string, any>, taskID: string) {
        return await this.requestAbortable(
            internalBot,
            taskID,
            {
                message: data.message,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                tweaks: data.file_path ? { LangboardFile: { path: data.file_path } } : {},
                restData: data.rest_data,
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            true
        );
    }

    public async isAvailable(internalBot: InternalBot) {
        return await this.canRequest(internalBot);
    }

    public async upload(internalBot: InternalBot, file: formidable.File): Promise<string | null> {
        return await this.upload(internalBot, file);
    }
}

registerBot(ProjectChatBot);

export default ProjectChatBot;
