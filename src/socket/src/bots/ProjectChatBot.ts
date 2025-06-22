/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseBot, { registerBot } from "@/core/ai/BaseBot";
import SnowflakeID from "@/core/db/SnowflakeID";
import { EInternalBotType } from "@/models/InternalBotSetting";
import formidable from "formidable";

class ProjectChatBot extends BaseBot {
    static get BOT_TYPE(): EInternalBotType {
        return EInternalBotType.ProjectChat;
    }

    public async run(data: Record<string, any>) {
        return await this.runLangflow(
            {
                message: data.message,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
                tweaks: data.file_path ? { LangboardFile: { path: data.file_path } } : {},
            },
            true
        );
    }

    public async runAbortable(data: Record<string, any>, taskID: string) {
        return await this.runLangflowAbortable(
            taskID,
            {
                message: data.message,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
                tweaks: data.file_path ? { LangboardFile: { path: data.file_path } } : {},
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

registerBot(ProjectChatBot);

export default ProjectChatBot;
