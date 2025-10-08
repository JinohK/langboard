import BaseBot, { IBotIsAvailableOptions, IBotRunAbortableOptions, IBotRunOptions, IBotUploadOptions, registerBot } from "@/core/ai/BaseBot";
import SnowflakeID from "@/core/db/SnowflakeID";
import { EInternalBotType } from "@/models/InternalBot";

class ProjectChatBot extends BaseBot {
    public static get BOT_TYPE(): EInternalBotType {
        return EInternalBotType.ProjectChat;
    }

    public async run({ data, ...options }: IBotRunOptions) {
        return await this.request({
            ...options,
            requestModel: {
                message: data.message,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                tweaks: data.file_path ? { LangboardFile: { path: data.file_path } } : {},
                restData: data.rest_data,
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            useStream: true,
        });
    }

    public async runAbortable({ data, ...options }: IBotRunAbortableOptions) {
        return await this.requestAbortable({
            ...options,
            requestModel: {
                message: data.message,
                projectUID: data.project_uid,
                userId: data.user_id,
                inputType: "chat",
                outputType: "chat",
                tweaks: data.file_path ? { LangboardFile: { path: data.file_path } } : {},
                restData: data.rest_data,
                sessionId: `${new SnowflakeID(data.user_id).toShortCode()}-${data.project_uid}`,
            },
            useStream: true,
        });
    }

    public async isAvailable(options: IBotIsAvailableOptions): Promise<bool> {
        return await this.canRequest(options);
    }

    public async upload(options: IBotUploadOptions): Promise<string | null> {
        return await this.uploadFile(options);
    }
}

registerBot(ProjectChatBot);

export default ProjectChatBot;
