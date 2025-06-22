/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLangflowRequestModel } from "@/core/ai/LangflowHelper";
import langflowStreamResponse from "@/core/ai/LangflowStreamResponse";
import { TBigIntString } from "@/core/db/BaseModel";
import { api } from "@/core/helpers/Api";
import EHttpStatus from "@/core/server/EHttpStatus";
import { convertSafeEnum } from "@/core/utils/StringUtils";
import InternalBotSetting, { EInternalBotPlatform, EInternalBotType } from "@/models/InternalBotSetting";
import formidable from "formidable";
import fs from "fs";

export interface ILangflowRequestModel {
    message: string;
    projectUID: string;
    userId: TBigIntString;
    inputType?: string;
    outputType?: string;
    sessionId?: string;
    tweaks?: Record<string, Record<string, any>>;
}

abstract class BaseBot {
    static get BOT_TYPE(): EInternalBotType {
        return null!;
    }
    #abortableTasks: Map<string, AbortController>;

    constructor() {
        this.#abortableTasks = new Map();
    }

    public abstract run(data: Record<string, any>): Promise<string | ReturnType<typeof langflowStreamResponse> | null>;
    public abstract runAbortable(data: Record<string, any>, taskID: string): Promise<string | ReturnType<typeof langflowStreamResponse> | null>;
    public abstract isAvailable(): Promise<InternalBotSetting | null>;
    public abstract uploadFile(file: formidable.File): Promise<string | null>;

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

    protected async isLangflowAvailable(): Promise<InternalBotSetting | null> {
        const botSetting = await this.getBotSetting();
        if (!botSetting || botSetting.platform !== EInternalBotPlatform.Langflow) {
            return null;
        }

        const healthCheck = await api.get(`${botSetting.url}/health`, {
            headers: await this.getBotRequestHeaders(botSetting),
        });

        return healthCheck.status === 200 ? botSetting : null;
    }

    protected async runLangflow(
        requestModel: ILangflowRequestModel,
        useStream: bool = false
    ): Promise<string | ReturnType<typeof langflowStreamResponse> | null> {
        const botSetting = await this.getBotSetting();
        if (!botSetting || botSetting.platform !== EInternalBotPlatform.Langflow) {
            return null;
        }

        const headers = await this.getBotRequestHeaders(botSetting);

        const apiRequestModel = createLangflowRequestModel({
            botSetting,
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
        taskID: string,
        requestModel: ILangflowRequestModel,
        useStream: bool = false
    ): Promise<string | ReturnType<typeof langflowStreamResponse> | null> {
        const botSetting = await this.getBotSetting();
        if (!botSetting || botSetting.platform !== EInternalBotPlatform.Langflow) {
            return null;
        }

        const headers = await this.getBotRequestHeaders(botSetting);

        const apiRequestModel = createLangflowRequestModel({
            botSetting,
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

            result = response.data;
        } catch {
            result = null;
        } finally {
            this.#abortableTasks.delete(taskID);
        }

        return result;
    }

    protected async uploadFileToLangflow(file: formidable.File): Promise<string | null> {
        const filename = file.originalFilename || file.newFilename;
        if (!filename || !file.size) {
            return null;
        }

        const botSetting = await this.getBotSetting();
        if (!botSetting || botSetting.platform !== EInternalBotPlatform.Langflow) {
            return null;
        }

        const headers = {
            "Content-Type": "multipart/form-data",
            ...(await this.getBotRequestHeaders(botSetting)),
        };

        const url = `${botSetting.url}/api/v2/files`;

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
            console.error(error);
            return null;
        }
    }

    async getBotSetting() {
        const constructor = this.#getConstructor();
        const botSetting = await InternalBotSetting.findByType(constructor.BOT_TYPE);
        return botSetting;
    }

    async getBotRequestHeaders(setting: InternalBotSetting) {
        const headers: Record<string, any> = {};
        switch (setting.platform) {
            case EInternalBotPlatform.Langflow:
                headers["x-api-key"] = setting.api_key;
                break;
            default:
                throw new Error(`Unsupported platform: ${setting.platform}`);
        }

        return headers;
    }

    #getConstructor() {
        return this.constructor as typeof BaseBot;
    }
}

const BOTS = new Map<EInternalBotType, BaseBot>();
export const registerBot = <TBot extends typeof BaseBot>(bot: TBot) => {
    if (!bot.BOT_TYPE) {
        throw new Error("Bot must have a botType property");
    }

    const botType = convertSafeEnum(EInternalBotType, bot.BOT_TYPE);
    BOTS.set(botType, new (bot as any)());
};

export const getBot = (botType: EInternalBotType): BaseBot | undefined => {
    botType = convertSafeEnum(EInternalBotType, botType);
    return BOTS.get(botType);
};

export default BaseBot;
