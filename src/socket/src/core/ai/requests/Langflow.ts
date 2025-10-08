/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOneTimeToken } from "@/core/ai/BotOneTimeToken";
import BaseRequest from "@/core/ai/requests/BaseRequest";
import { LangboardCalledVariablesComponent } from "@/core/ai/helpers/LangflowHelper";
import langflowStreamResponse from "@/core/ai/requests/LangflowStreamResponse";
import { IBotRequestModel } from "@/core/ai/types";
import SnowflakeID from "@/core/db/SnowflakeID";
import { api } from "@/core/helpers/Api";
import Logger from "@/core/utils/Logger";
import { EHttpStatus } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";
import formidable from "formidable";
import fs from "fs";
import { IStreamResponse } from "@/core/ai/requests/types";
import { EBotPlatform, EBotPlatformRunningType } from "@/models/bot.related.types";
import { OLLAMA_API_URL } from "@/Constants";

export interface ICreateLangflowRequestModelParams {
    headers: Record<string, any>;
    requestModel: IBotRequestModel;
    useStream?: bool;
}

class LangflowRequest extends BaseRequest {
    public async request(
        requestModel: IBotRequestModel,
        useStream: bool = false
    ): Promise<string | ReturnType<typeof langflowStreamResponse> | null> {
        const headers = this.getBotRequestHeaders();

        const apiRequestModel = this.#createLangflowRequestModel({
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

    public async requestAbortable(
        task: [AbortController, () => void],
        requestModel: IBotRequestModel,
        useStream: bool = false
    ): Promise<string | IStreamResponse | null> {
        const [abortController, finish] = task;
        const headers = this.getBotRequestHeaders();

        const apiRequestModel = this.#createLangflowRequestModel({
            headers,
            requestModel,
            useStream,
        });

        if (useStream) {
            return langflowStreamResponse({
                url: apiRequestModel.url,
                headers: apiRequestModel.headers,
                body: apiRequestModel.reqData,
                signal: abortController.signal,
                onEnd: finish,
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

            result = this.#parseLangflowResponse(response.data);
        } catch {
            result = null;
        } finally {
            finish();
        }

        return result;
    }

    public async upload(file: formidable.File): Promise<string | null> {
        const filename = file.originalFilename || file.newFilename;
        if (!filename || !file.size) {
            return null;
        }

        if (![EBotPlatform.Default, EBotPlatform.Langflow].includes(this.internalBot.platform)) {
            return null;
        }

        const headers = {
            "Content-Type": "multipart/form-data",
            ...this.getBotRequestHeaders(),
        };

        const url = `${this.baseURL}/api/v2/files`;

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

    public async isAvailable(): Promise<bool> {
        try {
            const healthCheck = await api.get(`${this.baseURL}/health`, {
                headers: this.getBotRequestHeaders(),
            });

            return healthCheck.status === EHttpStatus.HTTP_200_OK;
        } catch {
            return false;
        }
    }

    #createLangflowRequestModel({ headers, requestModel, useStream }: ICreateLangflowRequestModelParams) {
        const sessionId = requestModel.sessionId ?? Utils.String.Token.generate(32);
        const oneTimeToken = createOneTimeToken(new SnowflakeID(requestModel.userId));

        const queryParams = new URLSearchParams({
            stream: useStream ? "true" : "false",
        });

        let url = this.baseURL;
        switch (this.internalBot.platform_running_type) {
            case EBotPlatformRunningType.Default:
                url = `${url}/api/v1/run/${this.internalBot.id}`;
                break;
            case EBotPlatformRunningType.Endpoint:
                url = `${url}/${this.internalBot.value?.startsWith("/") ? this.internalBot.value.slice(1) : this.internalBot.value}`;
                break;
            case EBotPlatformRunningType.FlowJson:
                url = `${url}/api/v1/run/${this.internalBot.id}`;
                break;
            default:
                throw new Error(`Unsupported platform running type: ${this.internalBot.platform_running_type}`);
        }

        url = `${url}?${queryParams.toString()}`;

        requestModel.tweaks = requestModel.tweaks ?? {};

        const component = new LangboardCalledVariablesComponent(
            "chat",
            oneTimeToken,
            "user",
            { uid: new SnowflakeID(requestModel.userId).toShortCode() },
            requestModel.projectUID,
            [],
            requestModel.restData
        );

        const reqData = {
            input_value: requestModel.message,
            input_type: requestModel.inputType,
            output_type: requestModel.outputType,
            session: sessionId,
            session_id: sessionId,
            run_type: "internal_bot",
            uid: this.internalBot.uid,
            tweaks: {
                ...requestModel.tweaks,
                ...component.toTweaks(),
                ...component.toData(),
            },
        };

        if (this.internalBot.platform === EBotPlatform.Default && this.internalBot.platform_running_type === EBotPlatformRunningType.Default) {
            reqData.tweaks = this.#setDefaultTweaks(reqData.tweaks);
        }

        return {
            url,
            sessionId,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            oneTimeToken,
            reqData,
        };
    }

    #parseLangflowResponse(response: { session_id: string; outputs: Record<string, any>[] }): string {
        return response.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ?? "";
    }

    #setDefaultTweaks(tweaks: Record<string, any>) {
        try {
            const botValue: Record<string, any> = Utils.Json.Parse(this.internalBot.value ?? "{}");
            if (!botValue.agent_llm) {
                throw new Error("agent_llm is required for Default platform");
            }

            const agentLLM = botValue.agent_llm;
            delete botValue.agent_llm;

            if (["Ollama", "LM Studio"].includes(agentLLM)) {
                tweaks[agentLLM] = botValue;
            } else {
                botValue.agent_llm = agentLLM;
                tweaks.Agent = botValue;
            }

            if (tweaks.base_url) {
                delete tweaks.base_url;
            }

            if (tweaks.Ollama?.base_url === "default") {
                tweaks.Ollama.base_url = OLLAMA_API_URL;
            }

            const possibleAgents = ["", "Agent", "Ollama", "LM Studio"];
            for (let i = 0; i < possibleAgents.length; ++i) {
                const possibleKey = possibleAgents[i];
                const agentData = possibleKey ? (tweaks[possibleKey] ?? {}) : tweaks;

                if (agentData.system_prompt) {
                    let systemPrompt;
                    if (this.internalBotSettings) {
                        systemPrompt = this.internalBotSettings.prompt;
                    } else {
                        systemPrompt = agentData.system_prompt;
                    }
                    delete agentData.system_prompt;
                    tweaks.Prompt = {
                        prompt: systemPrompt,
                    };
                }

                if (agentData.api_names) {
                    const apiNames = agentData.api_names;
                    delete agentData.api_names;
                    tweaks[LangboardCalledVariablesComponent.name].api_names = apiNames;
                }
            }
        } catch {
            // Ignore parsing errors
        }

        return tweaks;
    }
}

export default LangflowRequest;
