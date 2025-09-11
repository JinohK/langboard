export const GOOGLE_GENERATIVE_AI_MODELS = [
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

export type TGoogleGenerativeAIModelName = (typeof GOOGLE_GENERATIVE_AI_MODELS)[number];
