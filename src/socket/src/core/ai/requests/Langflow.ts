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

        if (this.internalBot.platform !== EBotPlatform.Langflow) {
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
        const healthCheck = await api.get(`${this.baseURL}/health`, {
            headers: this.getBotRequestHeaders(),
        });

        return healthCheck.status === 200;
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

        if (this.internalBot.platform === EBotPlatform.Default && this.internalBot.platform_running_type === EBotPlatformRunningType.Default) {
            try {
                requestModel.tweaks.Agent = Utils.Json.Parse(this.internalBot.value ?? "{}");
                if (requestModel.tweaks.Agent.system_prompt) {
                    const systemPrompt = requestModel.tweaks.Agent.system_prompt;
                    delete requestModel.tweaks.Agent.system_prompt;
                    requestModel.tweaks.Prompt = {
                        prompt: systemPrompt,
                    };
                }

                if (requestModel.tweaks.Agent.api_names) {
                    const apiNames = requestModel.tweaks.Agent.api_names;
                    delete requestModel.tweaks.Agent.api_names;
                    component.setApiNames(apiNames);
                }
            } catch {
                // Ignore parsing errors
            }
        }

        return {
            url,
            sessionId,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            oneTimeToken,
            reqData: {
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
            },
        };
    }

    #parseLangflowResponse(response: { session_id: string; outputs: Record<string, any>[] }): string {
        return response.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ?? "";
    }
}

export default LangflowRequest;
