export const ANTHROPIC_MODELS = [
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-opus-latest",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
] as const;

export type TAnthropicModelName = (typeof ANTHROPIC_MODELS)[number];
