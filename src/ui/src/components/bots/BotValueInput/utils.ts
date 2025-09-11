import { TSVGIconMap } from "@/assets/svgs/icons";
import { TBotValueInputType } from "@/components/bots/BotValueInput/types";
import { EBotPlatform, EBotPlatformRunningType } from "@/core/models/bot.related.type";
import { TAgentModelName } from "@langboard/core/ai";

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

export const providerIconMap: Record<TAgentModelName, keyof TSVGIconMap> = {
    OpenAI: "OpenAI",
    "Azure OpenAI": "Azure",
    Groq: "Groq",
    Anthropic: "Anthropic",
    NVIDIA: "Nvidia",
    "Amazon Bedrock": "AWS",
    "Google Generative AI": "GoogleGenerativeAI",
    SambaNova: "SambaNova",
    Ollama: "Ollama",
    "LM Studio": "LMStudio",
};
