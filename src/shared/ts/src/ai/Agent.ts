export type TAgentModelName = (typeof AGENT_MODELS)[number];
export type TAzureOpenAiApiVersion = (typeof AZURE_OPEN_AI_API_VERSIONS)[number];
export type TOpenAiModelName = (typeof OPEN_AI_MODELS)[number];
export type TGroqModelName = (typeof GROQ_MODELS)[number];
export type TAnthropicModelName = (typeof ANTHROPIC_MODELS)[number];
export type TNvidiaModelName = (typeof NVIDIA_MODELS)[number];
export type TAmazonBedrockModelName = (typeof AMAZON_BEDROCK_MODELS)[number];
export type TAmazonBedrockRegion = (typeof AMAZON_BEDROCK_REGIONS)[number];
export type TGoogleGenerativeAIModelName = (typeof GOOGLE_GENERATIVE_AI_MODELS)[number];
export type TSambaNovaModelName = (typeof SAMBA_NOVA_MODELS)[number];

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
}

export interface IIntegerAgentFormInput extends IBaseAgentFormInput {
    type: "integer";
    defaultValue?: number;
    min: number;
    max: number;
}

export type TAgentFormInput = IStringAgentFormInput | ISelectAgentFormInput | IIntegerAgentFormInput;

const AGENT_MODELS = ["OpenAI", "Azure OpenAI", "Groq", "Anthropic", "NVIDIA", "Amazon Bedrock", "Google Generative AI", "SambaNova"] as const;

const AZURE_OPEN_AI_API_VERSIONS = [
    "2024-06-01",
    "2024-07-01-preview",
    "2024-08-01-preview",
    "2024-09-01-preview",
    "2024-10-01-preview",
    "2023-05-15",
    "2023-12-01-preview",
    "2024-02-15-preview",
    "2024-03-01-preview",
    "2024-12-01-preview",
    "2025-01-01-preview",
    "2025-02-01-preview",
] as const;

const OPEN_AI_MODELS = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4.5-preview",
    "gpt-4-turbo",
    "gpt-4-turbo-preview",
    "gpt-4",
    "gpt-3.5-turbo",
    "o1",
] as const;

const GROQ_MODELS = [
    "gemma2-9b-it",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama-guard-3-8b",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "qwen-qwq-32b",
    "qwen-2.5-coder-32b",
    "qwen-2.5-32b",
    "deepseek-r1-distill-qwen-32b",
    "deepseek-r1-distill-llama-70b",
    "llama-3.3-70b-specdec",
    "llama-3.2-1b-preview",
    "llama-3.2-3b-preview",
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "allam-2-7b",
] as const;

const ANTHROPIC_MODELS = [
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-opus-latest",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
] as const;

const NVIDIA_MODELS = [
    "meta/codellama-70b",
    "google/gemma-7b",
    "meta/llama2-70b",
    "mistralai/mistral-7b-instruct-v0.2",
    "mistralai/mixtral-8x7b-instruct-v0.1",
    "google/codegemma-7b",
    "google/gemma-2b",
    "google/recurrentgemma-2b",
    "mistralai/mistral-large",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "meta/llama3-8b-instruct",
    "meta/llama3-70b-instruct",
    "microsoft/phi-3-mini-128k-instruct",
    "snowflake/arctic",
    "databricks/dbrx-instruct",
    "microsoft/phi-3-mini-4k-instruct",
    "seallms/seallm-7b-v2.5",
    "aisingapore/sea-lion-7b-instruct",
    "microsoft/phi-3-small-8k-instruct",
    "microsoft/phi-3-small-128k-instruct",
    "microsoft/phi-3-medium-4k-instruct",
    "ibm/granite-8b-code-instruct",
    "ibm/granite-34b-code-instruct",
    "google/codegemma-1.1-7b",
    "mediatek/breeze-7b-instruct",
    "upstage/solar-10.7b-instruct",
    "writer/palmyra-med-70b-32k",
    "writer/palmyra-med-70b",
    "mistralai/mistral-7b-instruct-v0.3",
    "01-ai/yi-large",
    "nvidia/nemotron-4-340b-instruct",
    "mistralai/codestral-22b-instruct-v0.1",
    "google/gemma-2-9b-it",
    "google/gemma-2-27b-it",
    "microsoft/phi-3-medium-128k-instruct",
    "deepseek-ai/deepseek-coder-6.7b-instruct",
    "nv-mistralai/mistral-nemo-12b-instruct",
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-405b-instruct",
    "nvidia/usdcode-llama3-70b-instruct",
    "mistralai/mamba-codestral-7b-v0.1",
    "writer/palmyra-fin-70b-32k",
    "google/gemma-2-2b-it",
    "mistralai/mistral-large-2-instruct",
    "mistralai/mathstral-7b-v0.1",
    "rakuten/rakutenai-7b-instruct",
    "rakuten/rakutenai-7b-chat",
    "baichuan-inc/baichuan2-13b-chat",
    "thudm/chatglm3-6b",
    "microsoft/phi-3.5-mini-instruct",
    "microsoft/phi-3.5-moe-instruct",
    "nvidia/nemotron-mini-4b-instruct",
    "ai21labs/jamba-1.5-large-instruct",
    "ai21labs/jamba-1.5-mini-instruct",
    "yentinglin/llama-3-taiwan-70b-instruct",
    "tokyotech-llm/llama-3-swallow-70b-instruct-v0.1",
    "abacusai/dracarys-llama-3.1-70b-instruct",
    "qwen/qwen2-7b-instruct",
    "nvidia/llama-3.1-nemotron-51b-instruct",
    "meta/llama-3.2-1b-instruct",
    "meta/llama-3.2-3b-instruct",
    "nvidia/mistral-nemo-minitron-8b-8k-instruct",
    "institute-of-science-tokyo/llama-3.1-swallow-8b-instruct-v0.1",
    "institute-of-science-tokyo/llama-3.1-swallow-70b-instruct-v0.1",
    "zyphra/zamba2-7b-instruct",
    "ibm/granite-3.0-8b-instruct",
    "ibm/granite-3.0-3b-a800m-instruct",
    "nvidia/nemotron-4-mini-hindi-4b-instruct",
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "nvidia/usdcode-llama-3.1-70b-instruct",
    "meta/llama-3.3-70b-instruct",
    "qwen/qwen2.5-coder-32b-instruct",
    "qwen/qwen2.5-coder-7b-instruct",
    "nvidia/llama-3.1-nemotron-70b-reward",
    "nvidia/llama3-chatqa-1.5-8b",
    "nvidia/llama3-chatqa-1.5-70b",
    "adept/fuyu-8b",
    "google/deplot",
    "microsoft/kosmos-2",
    "nvidia/neva-22b",
    "google/paligemma",
    "microsoft/phi-3-vision-128k-instruct",
    "microsoft/phi-3.5-vision-instruct",
    "nvidia/vila",
    "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.2-90b-vision-instruct",
    "snowflake/arctic-embed-l",
    "NV-Embed-QA",
    "nvidia/nv-embed-v1",
    "nvidia/nv-embedqa-mistral-7b-v2",
    "nvidia/nv-embedqa-e5-v5",
    "baai/bge-m3",
    "nvidia/embed-qa-4",
    "nvidia/llama-3.2-nv-embedqa-1b-v1",
    "nvidia/llama-3.2-nv-embedqa-1b-v2",
    "nv-rerank-qa-mistral-4b:1",
    "nvidia/nv-rerankqa-mistral-4b-v3",
    "nvidia/llama-3.2-nv-rerankqa-1b-v1",
    "nvidia/llama-3.2-nv-rerankqa-1b-v2",
    "bigcode/starcoder2-7b",
    "bigcode/starcoder2-15b",
    "nvidia/mistral-nemo-minitron-8b-base",
] as const;

const AMAZON_BEDROCK_MODELS = [
    "amazon.titan-text-express-v1",
    "amazon.titan-text-lite-v1",
    "amazon.titan-text-premier-v1:0",
    "anthropic.claude-v2",
    "anthropic.claude-v2:1",
    "anthropic.claude-3-sonnet-20240229-v1:0",
    "anthropic.claude-3-5-sonnet-20240620-v1:0",
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "anthropic.claude-3-haiku-20240307-v1:0",
    "anthropic.claude-3-5-haiku-20241022-v1:0",
    "anthropic.claude-3-opus-20240229-v1:0",
    "anthropic.claude-instant-v1",
    "ai21.jamba-instruct-v1:0",
    "ai21.j2-mid-v1",
    "ai21.j2-ultra-v1",
    "ai21.jamba-1-5-large-v1:0",
    "ai21.jamba-1-5-mini-v1:0",
    "cohere.command-text-v14",
    "cohere.command-light-text-v14",
    "cohere.command-r-v1:0",
    "cohere.command-r-plus-v1:0",
    "meta.llama2-13b-chat-v1",
    "meta.llama2-70b-chat-v1",
    "meta.llama3-8b-instruct-v1:0",
    "meta.llama3-70b-instruct-v1:0",
    "meta.llama3-1-8b-instruct-v1:0",
    "meta.llama3-1-70b-instruct-v1:0",
    "meta.llama3-1-405b-instruct-v1:0",
    "meta.llama3-2-1b-instruct-v1:0",
    "meta.llama3-2-3b-instruct-v1:0",
    "meta.llama3-2-11b-instruct-v1:0",
    "meta.llama3-2-90b-instruct-v1:0",
    "mistral.mistral-7b-instruct-v0:2",
    "mistral.mixtral-8x7b-instruct-v0:1",
    "mistral.mistral-large-2402-v1:0",
    "mistral.mistral-large-2407-v1:0",
    "mistral.mistral-small-2402-v1:0",
] as const;

const AMAZON_BEDROCK_REGIONS = [
    "us-west-2",
    "us-west-1",
    "us-gov-west-1",
    "us-gov-east-1",
    "us-east-2",
    "us-east-1",
    "sa-east-1",
    "me-south-1",
    "me-central-1",
    "il-central-1",
    "eu-west-3",
    "eu-west-2",
    "eu-west-1",
    "eu-south-2",
    "eu-south-1",
    "eu-north-1",
    "eu-central-2",
    "eu-central-1",
    "cn-northwest-1",
    "cn-north-1",
    "ca-west-1",
    "ca-central-1",
    "ap-southeast-5",
    "ap-southeast-4",
    "ap-southeast-3",
    "ap-southeast-2",
    "ap-southeast-1",
    "ap-south-2",
    "ap-south-1",
    "ap-northeast-3",
    "ap-northeast-2",
    "ap-northeast-1",
    "ap-east-1",
    "af-south-1",
] as const;

const GOOGLE_GENERATIVE_AI_MODELS = [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-exp-1206",
    "gemini-2.0-flash-thinking-exp-01-21",
    "learnlm-1.5-pro-experimental",
    "gemma-2-2b",
    "gemma-2-9b",
    "gemma-2-27b",
] as const;

const SAMBA_NOVA_MODELS = [
    "Meta-Llama-3.3-70B-Instruct",
    "Meta-Llama-3.1-8B-Instruct",
    "Meta-Llama-3.1-70B-Instruct",
    "Meta-Llama-3.1-405B-Instruct",
    "DeepSeek-R1-Distill-Llama-70B",
    "DeepSeek-R1",
    "Meta-Llama-3.2-1B-Instruct",
    "Meta-Llama-3.2-3B-Instruct",
    "Llama-3.2-11B-Vision-Instruct",
    "Llama-3.2-90B-Vision-Instruct",
    "Qwen2.5-Coder-32B-Instruct",
    "Qwen2.5-72B-Instruct",
    "QwQ-32B-Preview",
    "Qwen2-Audio-7B-Instruct",
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
                { type: "select", name: "model_id", label: "Model", options: AMAZON_BEDROCK_MODELS as unknown as string[] },
                { type: "select", name: "region_name", label: "Region", options: AMAZON_BEDROCK_REGIONS as unknown as string[] }
            );
            break;
        case "Anthropic":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Model", options: ANTHROPIC_MODELS as unknown as string[] }
            );
            break;
        case "Google Generative AI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Model", options: GOOGLE_GENERATIVE_AI_MODELS as unknown as string[] }
            );
            break;
        case "Groq":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Model", options: GROQ_MODELS as unknown as string[] }
            );
            break;
        case "NVIDIA":
            form.push(
                { type: "password", name: "api_key", label: "API Key", nullable: true },
                { type: "select", name: "model_name", label: "Model", options: NVIDIA_MODELS as unknown as string[] }
            );
            break;
        case "OpenAI":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Model", options: OPEN_AI_MODELS as unknown as string[] }
            );
            break;
        case "SambaNova":
            form.push(
                { type: "password", name: "api_key", label: "API Key" },
                { type: "select", name: "model_name", label: "Model", options: SAMBA_NOVA_MODELS as unknown as string[] }
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
