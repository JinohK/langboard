/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBot } from "@/core/ai/BaseBot";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/server/ESocketTopic";
import ISocketClient from "@/core/server/ISocketClient";
import InternalBotSetting, { EInternalBotType } from "@/models/InternalBotSetting";
import formidable from "formidable";

class BotRunner {
    public static async run(botType: EInternalBotType, data: Record<string, any>) {
        const bot = getBot(botType);
        if (!bot) {
            return null;
        }
        return await bot.run(data);
    }

    public static async runAbortable(botType: EInternalBotType, task_id: string, data: Record<string, any>) {
        const bot = getBot(botType);
        if (!bot) {
            return null;
        }
        return await bot.runAbortable(data, task_id);
    }

    public static async abort(botType: EInternalBotType, task_id: string, client?: ISocketClient): Promise<void> {
        const bot = getBot(botType);
        if (!bot) {
            return;
        }
        await bot.abort(task_id);
        client?.send({
            topic: ESocketTopic.Global,
            topic_id: GLOBAL_TOPIC_ID,
            event: "task:aborted",
            data: {
                task_id,
            },
        });
    }

    public static async isAvailable(botType: EInternalBotType): Promise<InternalBotSetting | null> {
        const bot = getBot(botType);
        if (!bot) {
            return null;
        }
        return await bot.isAvailable();
    }

    public static async uploadFile(botType: EInternalBotType, file: formidable.File): Promise<string | null> {
        const bot = getBot(botType);
        if (!bot) {
            return null;
        }
        return await bot.uploadFile(file);
    }

    public static isAborted(botType: EInternalBotType, task_id: string): bool {
        const bot = getBot(botType);
        if (!bot) {
            return true;
        }
        return bot.isAborted(task_id);
    }

    public static createAbortedChecker(botType: EInternalBotType, task_id: string) {
        const isAborted = () => {
            const aborted = BotRunner.isAborted(botType, task_id);
            return aborted;
        };
        return isAborted;
    }
}

export default BotRunner;
