/* eslint-disable @typescript-eslint/no-explicit-any */
import { IStreamResponse } from "@/core/ai/requests/types";
import { IBotRequestModel } from "@/core/ai/types";
import { EBotPlatform } from "@/models/bot.related.types";
import InternalBot from "@/models/InternalBot";
import formidable from "formidable";

abstract class BaseRequest {
    constructor(
        protected internalBot: InternalBot,
        protected baseURL: string
    ) {
        this.baseURL = !baseURL.endsWith("/") ? baseURL : baseURL.slice(0, -1);
    }

    public abstract request(requestModel: IBotRequestModel, useStream?: bool): Promise<string | IStreamResponse | null>;
    public abstract requestAbortable(
        task: [AbortController, () => void],
        requestModel: IBotRequestModel,
        useStream?: bool
    ): Promise<string | IStreamResponse | null>;
    public abstract upload(file: formidable.File): Promise<string | null>;
    public abstract isAvailable(): Promise<bool>;

    protected getBotRequestHeaders() {
        const headers: Record<string, any> = {};
        switch (this.internalBot.platform) {
            case EBotPlatform.Default:
                break;
            case EBotPlatform.Langflow:
                headers["x-api-key"] = this.internalBot.api_key;
                break;
            default:
                throw new Error(`Unsupported platform: ${this.internalBot.platform}`);
        }

        return headers;
    }
}

export default BaseRequest;
