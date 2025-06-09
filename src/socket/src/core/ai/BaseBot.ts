/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOneTimeToken } from "@/core/ai/BotOneTimeToken";
import EInternalBotType from "@/core/ai/EInternalBotType";
import { ELangflowConstants, LangboardCalledVariablesComponent } from "@/core/ai/LangflowHelper";
import langflowStreamResponse from "@/core/ai/LangflowStreamResponse";
import { TBigIntString } from "@/core/db/BaseModel";
import SnowflakeID from "@/core/db/SnowflakeID";
import JsonUtils from "@/core/utils/JsonUtils";
import { convertSafeEnum, generateToken } from "@/core/utils/StringUtils";
import AppSetting, { EAppSettingType } from "@/models/AppSetting";
import axios from "axios";
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

        const apiRequestModel = new LangflowRequestModel(settings, requestModel, useStream);

        if (useStream) {
            console.log(useStream);

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

        const apiRequestModel = new LangflowRequestModel(settings, requestModel, useStream);
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

class LangflowRequestModel {
    url: string;
    sessionId: string;
    headers: Record<string, string>;
    oneTimeToken: string;
    reqData: Record<string, any>;

    constructor(
        settings: Record<EAppSettingType.LangflowUrl | EAppSettingType.LangflowApiKey, string>,
        requestModel: ILangflowRequestModel,
        useStream: bool = false
    ) {
        this.url = `${settings[EAppSettingType.LangflowUrl]}/api/v1/run/${requestModel.flowId}?stream=${useStream}`;
        this.sessionId = requestModel.sessionId ?? generateToken(32);
        this.headers = {
            "Content-Type": "application/json",
            [ELangflowConstants.ApiKey]: settings[EAppSettingType.LangflowApiKey],
        };
        this.oneTimeToken = createOneTimeToken(new SnowflakeID(requestModel.userId));
        const reqData: Record<string, any> = {
            input_value: requestModel.message,
            session: this.sessionId,
            session_id: this.sessionId,
        };
        if (requestModel.inputType) {
            reqData.input_type = requestModel.inputType;
        }
        if (requestModel.outputType) {
            reqData.output_type = requestModel.outputType;
        }
        reqData.tweaks = {
            ...(requestModel.tweaks ?? {}),
            ...new LangboardCalledVariablesComponent(
                "chat",
                this.oneTimeToken,
                "user",
                { uid: new SnowflakeID(requestModel.userId).toShortCode() },
                requestModel.projectUID
            ).toTweaks(),
        };
        this.reqData = reqData;
    }
}

export default BaseBot;
