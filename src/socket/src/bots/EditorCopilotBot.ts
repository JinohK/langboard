/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseBot, { registerBot } from "@/core/ai/BaseBot";
import SnowflakeID from "@/core/db/SnowflakeID";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import formidable from "formidable";

class EditorCopilotBot extends BaseBot {
    static get BOT_TYPE(): EInternalBotType {
        return EInternalBotType.EditorCopilot;
    }

    public async run(internalBot: InternalBot, data: Record<string, any>) {
        return await this.runLangflow(
            internalBot,
            {
                message: data.prompt,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                tweaks: { Prompt: { prompt: data.system } },
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            false
        );
    }

    public async runAbortable(internalBot: InternalBot, data: Record<string, any>, taskID: string) {
        return await this.runLangflowAbortable(
            internalBot,
            taskID,
            {
                message: data.prompt,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                tweaks: { Prompt: { prompt: data.system } },
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            false
        );
    }

    public async isAvailable(internalBot: InternalBot) {
        return await this.isLangflowAvailable(internalBot);
    }

    public async uploadFile(internalBot: InternalBot, file: formidable.File): Promise<string | null> {
        return await this.uploadFileToLangflow(internalBot, file);
    }
}

registerBot(EditorCopilotBot);

export default EditorCopilotBot;
