/* eslint-disable @typescript-eslint/no-explicit-any */
import EInternalBotType from "@/core/ai/EInternalBotType";
import { createLangflowRequestModel } from "@/core/ai/LangflowHelper";
import langflowStreamResponse from "@/core/ai/LangflowStreamResponse";
import { TBigIntString } from "@/core/db/BaseModel";
import JsonUtils from "@/core/utils/JsonUtils";
import { convertSafeEnum } from "@/core/utils/StringUtils";
import AppSetting, { EAppSettingType } from "@/models/AppSetting";
import axios from "axios";
import formidable from "formidable";
import { In } from "typeorm";

export interface ILangflowRequestModel {
    flowId: string;
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
    static get BOT_AVATAR(): string | null {
        return null;
    }
    #abortableTasks: Map<string, AbortController>;

    constructor() {
        this.#abortableTasks = new Map();
    }

    public abstract run(data: Record<string, any>): Promise<string | ReturnType<typeof langflowStreamResponse> | null>;
    public abstract runAbortable(data: Record<string, any>, taskID: string): Promise<string | ReturnType<typeof langflowStreamResponse> | null>;
    public abstract isAvailable(): Promise<bool>;
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

    protected async isLangflowAvailable(): Promise<bool> {
        const settings = await this.#getLangflowSettings();
        if (!settings) {
            return false;
        }

        const healthCheck = await axios.get(`${settings[EAppSettingType.LangflowUrl]}/health`, {
            headers: {
                "x-api-key": settings[EAppSettingType.LangflowApiKey],
            },
        });

        return healthCheck.status === 200;
    }

    protected async runLangflow(
        requestModel: ILangflowRequestModel,
        useStream: bool = false
    ): Promise<string | ReturnType<typeof langflowStreamResponse> | null> {
        const settings = await this.#getLangflowSettings();
        if (!settings) {
            return null;
        }

        const apiRequestModel = createLangflowRequestModel(settings, requestModel, useStream);

        if (useStream) {
            return langflowStreamResponse({
                url: apiRequestModel.url,
                headers: apiRequestModel.headers,
                body: apiRequestModel.reqData,
            });
        }

        try {
            const response = await axios.post(apiRequestModel.url, apiRequestModel.reqData, {
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
        const settings = await this.#getLangflowSettings();
        if (!settings) {
            return null;
        }

        const apiRequestModel = createLangflowRequestModel(settings, requestModel, useStream);
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
            const response = await axios.post(apiRequestModel.url, apiRequestModel.reqData, {
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

        const settings = await this.#getLangflowSettings();
        if (!settings) {
            return null;
        }

        const url = `${settings[EAppSettingType.LangflowUrl]}/api/v2/files`;
        const headers = {
            "Content-Type": "multipart/form-data",
            "x-api-key": settings[EAppSettingType.LangflowApiKey],
        };

        const formData = new FormData();
        formData.append("file", file, filename);

        try {
            const response = await axios.post(url, formData, {
                headers: {
                    ...headers,
                },
                data: formData,
            });

            if (response.status !== 200) {
                throw new Error("Langflow file upload failed");
            }

            return response.data.path ?? null;
        } catch (error) {
            return null;
        }
    }

    async #getLangflowSettings() {
        const rawSettings = await AppSetting.find({
            where: {
                setting_type: In([EAppSettingType.LangflowUrl, EAppSettingType.LangflowApiKey]),
            },
        });
        const settings: Partial<Record<EAppSettingType.LangflowUrl | EAppSettingType.LangflowApiKey, string>> = {};
        if (!rawSettings || rawSettings.length !== 2) {
            return undefined;
        }

        for (let i = 0; i < rawSettings.length; ++i) {
            const row = rawSettings[i];
            settings[row.setting_type as EAppSettingType.LangflowUrl | EAppSettingType.LangflowApiKey] = JsonUtils.Parse(row.setting_value);
        }

        if (!settings[EAppSettingType.LangflowUrl] || !settings[EAppSettingType.LangflowApiKey]) {
            return undefined;
        }

        return settings as Record<EAppSettingType.LangflowUrl | EAppSettingType.LangflowApiKey, string>;
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
