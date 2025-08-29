import { TBotValueInputType } from "@/components/BotValueInput/types";
import { EBotPlatform, EBotPlatformRunningType } from "@/core/models/bot.related.type";

export const getValueType = (platform: EBotPlatform, runningType: EBotPlatformRunningType): TBotValueInputType => {
    if (platform === EBotPlatform.Default) {
        if (runningType === EBotPlatformRunningType.Default) {
            return "default";
        }
    }

    switch (runningType) {
        case EBotPlatformRunningType.FlowJson:
            return "json";
        default:
            return "text";
    }
};

export const requirements: Partial<Record<EBotPlatform, Partial<Record<EBotPlatformRunningType, ("url" | "apiKey" | "value")[]>>>> = {
    [EBotPlatform.Default]: {
        [EBotPlatformRunningType.Default]: ["value"],
    },
    [EBotPlatform.Langflow]: {
        [EBotPlatformRunningType.Endpoint]: ["url", "apiKey", "value"],
        [EBotPlatformRunningType.FlowJson]: ["value"],
    },
};
