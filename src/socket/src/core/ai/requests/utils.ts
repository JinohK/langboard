/* eslint-disable @typescript-eslint/no-explicit-any */
import { DEFAULT_FLOWS_URL } from "@/Constants";
import BaseRequest from "@/core/ai/requests/BaseRequest";
import LangflowRequest from "@/core/ai/requests/Langflow";
import { api } from "@/core/helpers/Api";
import { EBotPlatform, EBotPlatformRunningType } from "@/models/bot.related.types";
import InternalBot from "@/models/InternalBot";
import { EHttpStatus } from "@langboard/core/enums";
import { Utils } from "@langboard/core/utils";

export const createRequest = (internalBot: InternalBot): BaseRequest | null => {
    internalBot.platform = Utils.String.convertSafeEnum(EBotPlatform, internalBot.platform);
    internalBot.platform_running_type = Utils.String.convertSafeEnum(EBotPlatformRunningType, internalBot.platform_running_type);

    switch (internalBot.platform) {
        case EBotPlatform.Default:
            switch (internalBot.platform_running_type) {
                case EBotPlatformRunningType.Default:
                    return new LangflowRequest(internalBot, DEFAULT_FLOWS_URL);
                default:
                    return null;
            }
        case EBotPlatform.Langflow:
            switch (internalBot.platform_running_type) {
                case EBotPlatformRunningType.Endpoint:
                    return new LangflowRequest(internalBot, internalBot.url);
                case EBotPlatformRunningType.FlowJson:
                    return new LangflowRequest(internalBot, DEFAULT_FLOWS_URL);
                default:
                    return null;
            }
        default:
            return null;
    }
};

export const getBotStatusMap = async (): Promise<Record<string, any> | null> => {
    try {
        const response = await api.get(`${DEFAULT_FLOWS_URL}/bot/status/map`);

        if (response.status !== EHttpStatus.HTTP_200_OK) {
            throw new Error("Langflow get bot status map failed");
        }

        return response.data;
    } catch {
        return null;
    }
};
