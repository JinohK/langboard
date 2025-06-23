/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBot } from "@/core/ai/BaseBot";
import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/server/ESocketTopic";
import ISocketClient from "@/core/server/ISocketClient";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import formidable from "formidable";

class BotRunner {
    public static async run(internalBot: InternalBot, data: Record<string, any>) {
        const bot = getBot(internalBot.bot_type);
        if (!bot) {
            return null;
        }
        return await bot.run(internalBot, data);
    }

    public static async runAbortable(internalBot: InternalBot, task_id: string, data: Record<string, any>) {
        const bot = getBot(internalBot.bot_type);
        if (!bot) {
            return null;
        }
        return await bot.runAbortable(internalBot, data, task_id);
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

    public static async isAvailable(internalBot: InternalBot): Promise<bool> {
        const bot = getBot(internalBot.bot_type);
        if (!bot) {
            return false;
        }
        return await bot.isAvailable(internalBot);
    }

    public static async uploadFile(internalBot: InternalBot, file: formidable.File): Promise<string | null> {
        const bot = getBot(internalBot.bot_type);
        if (!bot) {
            return null;
        }
        return await bot.uploadFile(internalBot, file);
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
