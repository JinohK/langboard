/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBot } from "@/core/ai/BaseBot";
import EInternalBotType from "@/core/ai/EInternalBotType";
import { TSocketSendParams } from "@/core/socket/ISocketClient";
import SocketClient from "@/core/socket/SocketClient";

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

    public static async abort(botType: EInternalBotType, task_id: string): Promise<void> {
        const bot = getBot(botType);
        if (!bot) {
            return;
        }
        await bot.abort(task_id);
    }

    public static async isAvailable(botType: EInternalBotType): Promise<bool> {
        const bot = getBot(botType);
        if (!bot) {
            return false;
        }
        return await bot.isAvailable();
    }

    public static isAborted(botType: EInternalBotType, task_id: string): bool {
        const bot = getBot(botType);
        if (!bot) {
            return true;
        }
        return bot.isAborted(task_id);
    }

    public static createAbortedChecker(botType: EInternalBotType, client: SocketClient, task_id: string, eventData: TSocketSendParams) {
        const isAborted = () => {
            const aborted = BotRunner.isAborted(botType, task_id);
            if (aborted) {
                client.send(eventData);
            }
            return aborted;
        };
        return isAborted;
    }
}

export default BotRunner;
