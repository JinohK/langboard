/* eslint-disable @typescript-eslint/no-explicit-any */
import { AMAZON_BEDROCK_MODELS, AMAZON_BEDROCK_REGIONS, TAmazonBedrockModelName, TAmazonBedrockRegion } from "@/ai/models/Amazon";
import { ANTHROPIC_MODELS, TAnthropicModelName } from "@/ai/models/Anthropic";
import { AZURE_OPEN_AI_API_VERSIONS, TAzureOpenAiApiVersion } from "@/ai/models/Azure";
import { GOOGLE_GENERATIVE_AI_MODELS, TGoogleGenerativeAIModelName } from "@/ai/models/Google";
import { GROQ_MODELS, TGroqModelName } from "@/ai/models/Groq";
import { getLMStudioModels } from "@/ai/models/LMStudio";
import { NVIDIA_MODELS, TNvidiaModelName } from "@/ai/models/Nvidia";
import { getOllamaModels } from "@/ai/models/Ollama";
import { OPEN_AI_MODELS, TOpenAiModelName } from "@/ai/models/OpenAI";
import { SAMBA_NOVA_MODELS, TSambaNovaModelName } from "@/ai/models/SambaNova";

export type TAgentModelName = (typeof AGENT_MODELS)[number];

interface IBaseAgentInput {
    langModel: TAgentModelName;
}

export interface IAzureOpenAiAgentInput extends IBaseAgentInput {
    langModel: "Azure OpenAI";
    apiKey: string;
    apiVersion: TAzureOpenAiApiVersion;
    endpoint: string;
    deploymentName: string;
}

export interface IOpenAiAgentInput extends IBaseAgentInput {
    langModel: "OpenAI";
    model: TOpenAiModelName;
}

export interface IGroqAgentInput extends IBaseAgentInput {
    langModel: "Groq";
    apiKey?: string;
    model: TGroqModelName;
}

export interface IAnthropicAgentInput extends IBaseAgentInput {
    langModel: "Anthropic";
    apiKey?: string;
    model: TAnthropicModelName;
}

export interface INvidiaAgentInput extends IBaseAgentInput {
    langModel: "NVIDIA";
    apiKey?: string;
    model: TNvidiaModelName;
}

export interface IAmazonBedrockAgentInput extends IBaseAgentInput {
    langModel: "Amazon Bedrock";
    accessKeyID: string;
    secretAccessKey: string;
    sessionToken?: string;
    model: TAmazonBedrockModelName;
    region: TAmazonBedrockRegion;
}

export interface IGoogleGenerativeAiAgentInput extends IBaseAgentInput {
    langModel: "Google Generative AI";
    apiKey: string;
    model: TGoogleGenerativeAIModelName;
}

export interface ISambaNovaAgentInput extends IBaseAgentInput {
    langModel: "SambaNova";
    apiKey: string;
    model: TSambaNovaModelName;
}

export type TAgentInput =
    | IAzureOpenAiAgentInput
    | IOpenAiAgentInput
    | IGroqAgentInput
    | IAnthropicAgentInput
    | INvidiaAgentInput
    | IAmazonBedrockAgentInput
    | IGoogleGenerativeAiAgentInput
    | ISambaNovaAgentInput;

interface IBaseAgentFormInput {
    type: "text" | "password" | "select" | "integer";
    name: string;
    label: string;
    defaultValue?: string | number;
    nullable?: bool;
}

export interface IStringAgentFormInput extends IBaseAgentFormInput {
    type: "text" | "password";
    defaultValue?: string;
}

export interface ISelectAgentFormInput extends IBaseAgentFormInput {
    type: "select";
    defaultValue?: string;
    options: string[];
    getOptions?: (values: Record<string, any>) => Promise<string[]>;
}

export interface IIntegerAgentFormInput extends IBaseAgentFormInput {
    type: "integer";
    defaultValue?: number;
    min: number;
    max: number;
}

export type TAgentFormInput = IStringAgentFormInput | ISelectAgentFormInput | IIntegerAgentFormInput;

const AGENT_MODELS = [
    "OpenAI",
    "Azure OpenAI",
    "Groq",
    "Anthropic",
    "NVIDIA",
    "Amazon Bedrock",
    "Google Generative AI",
    "SambaNova",
    "Ollama",
    "LM Studio",
] as const;

const getInputForm = (model: TAgentModelName): TAgentFormInput[] => {
    const form: TAgentFormInput[] = [];
    switch (model) {
        case "Azure OpenAI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                {
                    type: "select",
                    name: "api_version",
                    label: "API Version",
                    options: AZURE_OPEN_AI_API_VERSIONS as unknown as string[],
                },
                { type: "text", name: "azure_endpoint", label: "Endpoint" },
                { type: "text", name: "azure_deployment", label: "Deployment Name" }
            );
            break;
        case "Amazon Bedrock":
            form.push(
                { type: "password", name: "aws_access_key_id", label: "Access Key ID" },
                { type: "password", name: "aws_secret_access_key", label: "Secret Access Key" },
                { type: "password", name: "aws_session_token", label: "Session Token", nullable: true },
                { type: "select", name: "model_id", label: "Provider", options: AMAZON_BEDROCK_MODELS as unknown as string[] },
                { type: "select", name: "region_name", label: "Region", options: AMAZON_BEDROCK_REGIONS as unknown as string[] }
            );
            break;
        case "Anthropic":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Provider", options: ANTHROPIC_MODELS as unknown as string[] }
            );
            break;
        case "Google Generative AI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Provider", options: GOOGLE_GENERATIVE_AI_MODELS as unknown as string[] }
            );
            break;
        case "Groq":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Provider", options: GROQ_MODELS as unknown as string[] }
            );
            break;
        case "NVIDIA":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Provider", options: NVIDIA_MODELS as unknown as string[] }
            );
            break;
        case "OpenAI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Provider", options: OPEN_AI_MODELS as unknown as string[] }
            );
            break;
        case "SambaNova":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Provider", options: SAMBA_NOVA_MODELS as unknown as string[] }
            );
            break;
        case "Ollama":
            form.push(
                { type: "text", name: "base_url", label: "Base URL", defaultValue: "" },
                {
                    type: "select",
                    name: "model_name",
                    label: "Provider",
                    options: [],
                    getOptions: getOllamaModels,
                }
            );
            break;
        case "LM Studio":
            form.push(
                { type: "text", name: "base_url", label: "Base URL", defaultValue: "" },
                { type: "text", name: "api_key", label: "API Key", nullable: true },
                {
                    type: "select",
                    name: "model_name",
                    label: "Provider",
                    options: [],
                    getOptions: getLMStudioModels,
                }
            );
            break;
        default:
            return [];
    }

    return form;
};

export const Agent = {
    AGENT_MODELS,
    AZURE_OPEN_AI_API_VERSIONS,
    OPEN_AI_MODELS,
    GROQ_MODELS,
    ANTHROPIC_MODELS,
    NVIDIA_MODELS,
    AMAZON_BEDROCK_MODELS,
    AMAZON_BEDROCK_REGIONS,
    GOOGLE_GENERATIVE_AI_MODELS,
    SAMBA_NOVA_MODELS,
    getInputForm,
};
