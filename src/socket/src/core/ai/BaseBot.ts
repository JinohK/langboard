/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLangflowRequestModel, parseLangflowResponse } from "@/core/ai/LangflowHelper";
import langflowStreamResponse from "@/core/ai/LangflowStreamResponse";
import { ILangflowRequestModel } from "@/core/ai/types";
import { api } from "@/core/helpers/Api";
import Logger from "@/core/utils/Logger";
import { Utils } from "@langboard/core/utils";
import InternalBot, { EInternalBotPlatform, EInternalBotType } from "@/models/InternalBot";
import formidable from "formidable";
import fs from "fs";
import { EHttpStatus } from "@langboard/core/enums";

abstract class BaseBot {
    static get BOT_TYPE(): EInternalBotType {
        return null!;
    }
    #abortableTasks: Map<string, AbortController>;

    constructor() {
        this.#abortableTasks = new Map();
    }

    public abstract run(internalBot: InternalBot, data: Record<string, any>): Promise<string | ReturnType<typeof langflowStreamResponse> | null>;
    public abstract runAbortable(
        internalBot: InternalBot,
        data: Record<string, any>,
        taskID: string
    ): Promise<string | ReturnType<typeof langflowStreamResponse> | null>;
    public abstract isAvailable(internalBot: InternalBot): Promise<bool>;
    public abstract uploadFile(internalBot: InternalBot, file: formidable.File): Promise<string | null>;

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

    protected async isLangflowAvailable(internalBot: InternalBot): Promise<bool> {
        if (internalBot.platform !== EInternalBotPlatform.Langflow) {
            return false;
        }

        const healthCheck = await api.get(`${internalBot.url}/health`, {
            headers: await this.getBotRequestHeaders(internalBot),
        });

        return healthCheck.status === 200;
    }

    protected async runLangflow(
        internalBot: InternalBot,
        requestModel: ILangflowRequestModel,
        useStream: bool = false
    ): Promise<string | ReturnType<typeof langflowStreamResponse> | null> {
        if (internalBot.platform !== EInternalBotPlatform.Langflow) {
            return null;
        }

        const headers = await this.getBotRequestHeaders(internalBot);

        const apiRequestModel = createLangflowRequestModel({
            internalBot,
            headers,
            requestModel,
            useStream,
        });

        if (useStream) {
            return langflowStreamResponse({
                url: apiRequestModel.url,
                headers: apiRequestModel.headers,
                body: apiRequestModel.reqData,
            });
        }

        try {
            const response = await api.post(apiRequestModel.url, apiRequestModel.reqData, {
                headers: apiRequestModel.headers,
            });

            if (response.status !== 200) {
                throw new Error("Langflow request failed");
            }

            return response.data;
        } catch {
            return null;
        }
    }

    protected async runLangflowAbortable(
        internalBot: InternalBot,
        taskID: string,
        requestModel: ILangflowRequestModel,
        useStream: bool = false
    ): Promise<string | ReturnType<typeof langflowStreamResponse> | null> {
        if (internalBot.platform !== EInternalBotPlatform.Langflow) {
            return null;
        }

        const headers = await this.getBotRequestHeaders(internalBot);

        const apiRequestModel = createLangflowRequestModel({
            internalBot,
            headers,
            requestModel,
            useStream,
        });

        const abortController = new AbortController();
        this.#abortableTasks.set(taskID, abortController);

        if (useStream) {
            return langflowStreamResponse({
                url: apiRequestModel.url,
                headers: apiRequestModel.headers,
                body: apiRequestModel.reqData,
                signal: abortController.signal,
                onEnd: () => {
                    this.#abortableTasks.delete(taskID);
                },
            });
        }

        let result;
        try {
            const response = await api.post(apiRequestModel.url, apiRequestModel.reqData, {
                headers: apiRequestModel.headers,
                timeout: 120000,
                signal: abortController.signal,
            });

            if (response.status !== 200) {
                throw new Error("Langflow request failed");
            }

            result = parseLangflowResponse(response.data);
        } catch {
            result = null;
        } finally {
            this.#abortableTasks.delete(taskID);
        }

        return result;
    }

    protected async uploadFileToLangflow(internalBot: InternalBot, file: formidable.File): Promise<string | null> {
        const filename = file.originalFilename || file.newFilename;
        if (!filename || !file.size) {
            return null;
        }

        if (internalBot.platform !== EInternalBotPlatform.Langflow) {
            return null;
        }

        const headers = {
            "Content-Type": "multipart/form-data",
            ...(await this.getBotRequestHeaders(internalBot)),
        };

        const url = `${internalBot.url}/api/v2/files`;

        const formData = new FormData();
        const blob = new Blob([fs.readFileSync(file.filepath)], { type: file.mimetype ?? undefined });
        formData.append("file", blob, filename);

        try {
            const response = await api.post(url, formData, {
                headers: {
                    ...headers,
                },
                data: formData,
            });

            if (![EHttpStatus.HTTP_200_OK, EHttpStatus.HTTP_201_CREATED].includes(response.status)) {
                throw new Error("Langflow file upload failed");
            }

            return response.data.path ?? null;
        } catch (error) {
            Logger.error(error);
            return null;
        }
    }

    async getBotRequestHeaders(internalBot: InternalBot) {
        const headers: Record<string, any> = {};
        switch (internalBot.platform) {
            case EInternalBotPlatform.Langflow:
                headers["x-api-key"] = internalBot.api_key;
                break;
            default:
                throw new Error(`Unsupported platform: ${internalBot.platform}`);
        }

        return headers;
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
