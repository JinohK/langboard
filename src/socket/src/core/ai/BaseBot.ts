/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBotRequestModel } from "@/core/ai/types";
import { Utils } from "@langboard/core/utils";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import formidable from "formidable";
import { createRequest } from "@/core/ai/requests/utils";
import { IStreamResponse } from "@/core/ai/requests/types";

abstract class BaseBot {
    public static get BOT_TYPE(): EInternalBotType {
        return null!;
    }
    #abortableTasks: Map<string, AbortController>;

    constructor() {
        this.#abortableTasks = new Map();
    }

    public abstract run(internalBot: InternalBot, data: Record<string, any>): Promise<string | IStreamResponse | null>;
    public abstract runAbortable(internalBot: InternalBot, data: Record<string, any>, taskID: string): Promise<string | IStreamResponse | null>;
    public abstract isAvailable(internalBot: InternalBot): Promise<bool>;
    public abstract upload(internalBot: InternalBot, file: formidable.File): Promise<string | null>;

    public async abort(taskID: string): Promise<void> {
        const task = this.#abortableTasks.get(taskID);
        if (!task) {
            return;
        }

        task.abort();

        this.#abortableTasks.delete(taskID);
    }

    public isAborted(taskID: string): bool {
        const task = this.#abortableTasks.get(taskID);
        if (!task) {
            return true;
        }

        return task.signal.aborted;
    }

    protected async canRequest(internalBot: InternalBot): Promise<bool> {
        const request = createRequest(internalBot);
        if (!request) {
            return false;
        }

        return await request.isAvailable();
    }

    protected async request(
        internalBot: InternalBot,
        requestModel: IBotRequestModel,
        useStream: bool = false
    ): Promise<string | IStreamResponse | null> {
        const request = createRequest(internalBot);
        if (!request) {
            return null;
        }

        return request.request(requestModel, useStream);
    }

    protected async requestAbortable(
        internalBot: InternalBot,
        taskID: string,
        requestModel: IBotRequestModel,
        useStream: bool = false
    ): Promise<string | IStreamResponse | null> {
        const request = createRequest(internalBot);
        if (!request) {
            return null;
        }

        const abortController = new AbortController();
        const onAbort = () => {
            this.#abortableTasks.delete(taskID);
            abortController.signal.removeEventListener("abort", onAbort);
        };
        abortController.signal.addEventListener("abort", onAbort);
        this.#abortableTasks.set(taskID, abortController);

        return request.requestAbortable([abortController, onAbort], requestModel, useStream);
    }

    protected async uploadFile(internalBot: InternalBot, file: formidable.File): Promise<string | null> {
        const request = createRequest(internalBot);
        if (!request) {
            return null;
        }

        return await request.upload(file);
    }
}

const BOTS = new Map<EInternalBotType, BaseBot>();
export const registerBot = <TBot extends typeof BaseBot>(bot: TBot) => {
    if (!bot.BOT_TYPE) {
        throw new Error("Bot must have a botType property");
    }

    const botType = Utils.String.convertSafeEnum(EInternalBotType, bot.BOT_TYPE);
    BOTS.set(botType, new (bot as any)());
};

export const getBot = (botType: EInternalBotType): BaseBot | undefined => {
    botType = Utils.String.convertSafeEnum(EInternalBotType, botType);
    return BOTS.get(botType);
};

export default BaseBot;
