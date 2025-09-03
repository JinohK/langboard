import { IBaseModel } from "@/core/models/Base";

export type TBotRelatedTargetTable = "project_column" | "card";

export enum EBotPlatform {
    Default = "default",
    Langflow = "langflow",
}

export enum EBotPlatformRunningType {
    Default = "default",
    Endpoint = "endpoint",
    FlowJson = "flow_json",
}

export const AVAILABLE_RUNNING_TYPES_BY_PLATFORM: Record<EBotPlatform, EBotPlatformRunningType[]> = {
    [EBotPlatform.Default]: [EBotPlatformRunningType.Default],
    [EBotPlatform.Langflow]: [EBotPlatformRunningType.Endpoint, EBotPlatformRunningType.FlowJson],
};

export const ALLOWED_ALL_IPS_BY_PLATFORMS: Record<EBotPlatform, EBotPlatformRunningType[]> = {
    [EBotPlatform.Default]: [EBotPlatformRunningType.Default],
    [EBotPlatform.Langflow]: [EBotPlatformRunningType.FlowJson],
};

export interface IBaseBotModel extends IBaseModel {
    platform: EBotPlatform;
    platform_running_type: EBotPlatformRunningType;
}
