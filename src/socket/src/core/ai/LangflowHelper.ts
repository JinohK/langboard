/* eslint-disable @typescript-eslint/no-explicit-any */
import { ILangflowRequestModel } from "@/core/ai/BaseBot";
import { createOneTimeToken } from "@/core/ai/BotOneTimeToken";
import SnowflakeID from "@/core/db/SnowflakeID";
import { DATA_TEXT_FORMAT_DESCRIPTIONS } from "@/core/utils/EditorUtils";
import { generateToken } from "@/core/utils/StringUtils";
import InternalBotSetting, { EInternalBotPlatformRunningType } from "@/models/InternalBotSetting";

export enum ELangflowConstants {
    ApiKey = "x-api-key",
}

abstract class BaseLangflowComponent {
    abstract toTweaks(): Record<string, any>;
    abstract toData(): Record<string, any>;
}

export class LangboardCalledVariablesComponent extends BaseLangflowComponent {
    #model: Record<string, any>;

    constructor(
        event: string,
        app_api_token: string,
        current_runner_type: "bot" | "user",
        current_runner_data?: Record<string, any>,
        project_uid?: string,
        bot_labels_for_project: Array<Record<string, any>> = [],
        rest_data?: Record<string, any>,
        custom_markdown_formats: Record<string, string> = DATA_TEXT_FORMAT_DESCRIPTIONS
    ) {
        super();
        this.#model = {
            event,
            app_api_token,
            current_runner_type,
            current_runner_data,
            project_uid,
            bot_labels_for_project,
            rest_data,
            custom_markdown_formats,
        };
    }

    toTweaks(): Record<string, any> {
        return { LangboardCalledVariablesComponent: this.toData() };
    }

    toData(): Record<string, any> {
        return { ...this.#model };
    }
}

export interface ICreateLangflowRequestModelParams {
    botSetting: InternalBotSetting;
    headers: Record<string, any>;
    requestModel: ILangflowRequestModel;
    useStream?: bool;
}

export const createLangflowRequestModel = ({ botSetting, headers, requestModel, useStream }: ICreateLangflowRequestModelParams) => {
    const sessionId = requestModel.sessionId ?? generateToken(32);
    const oneTimeToken = createOneTimeToken(new SnowflakeID(requestModel.userId));

    const queryParams = new URLSearchParams({
        stream: useStream ? "true" : "false",
    });

    let url = botSetting.url;
    switch (botSetting.platform_running_type) {
        case EInternalBotPlatformRunningType.FlowId:
            url = `${url}/api/v1/run/${botSetting.value}`;
            break;
        case EInternalBotPlatformRunningType.FlowJson:
            url = `${url}/api/v1/run/${botSetting.id}`;
            break;
        default:
            throw new Error(`Unsupported platform running type: ${botSetting.platform_running_type}`);
    }

    url = `${url}?${queryParams.toString()}`;

    return {
        url,
        sessionId,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        oneTimeToken,
        reqData: {
            input_value: requestModel.message,
            input_type: requestModel.inputType,
            output_type: requestModel.outputType,
            session: sessionId,
            session_id: sessionId,
            setting_uid: botSetting.uid,
            tweaks: {
                ...(requestModel.tweaks ?? {}),
                ...new LangboardCalledVariablesComponent(
                    "chat",
                    oneTimeToken,
                    "user",
                    { uid: new SnowflakeID(requestModel.userId).toShortCode() },
                    requestModel.projectUID
                ).toTweaks(),
            },
        },
    };
};

export const parseLangflowResponse = (response: { session_id: string; outputs: Record<string, any>[] }): string => {
    return response.outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ?? "";
};
