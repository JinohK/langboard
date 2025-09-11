export const AZURE_OPEN_AI_API_VERSIONS = [
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

export type TAzureOpenAiApiVersion = (typeof AZURE_OPEN_AI_API_VERSIONS)[number];
