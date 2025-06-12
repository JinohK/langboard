/* eslint-disable @typescript-eslint/no-explicit-any */
import { ILangflowRequestModel } from "@/core/ai/BaseBot";
import { createOneTimeToken } from "@/core/ai/BotOneTimeToken";
import SnowflakeID from "@/core/db/SnowflakeID";
import { DATA_TEXT_FORMAT_DESCRIPTIONS } from "@/core/utils/EditorUtils";
import { generateToken } from "@/core/utils/StringUtils";
import { EAppSettingType } from "@/models/AppSetting";

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

export const createLangflowRequestModel = (
    settings: Record<EAppSettingType.LangflowUrl | EAppSettingType.LangflowApiKey, string>,
    requestModel: ILangflowRequestModel,
    useStream: bool = false
) => {
    const sessionId = requestModel.sessionId ?? generateToken(32);
    const oneTimeToken = createOneTimeToken(new SnowflakeID(requestModel.userId));

    return {
        url: `${settings[EAppSettingType.LangflowUrl]}/api/v1/run/${requestModel.flowId}?stream=${useStream}`,
        sessionId,
        headers: {
            "Content-Type": "application/json",
            [ELangflowConstants.ApiKey]: settings[EAppSettingType.LangflowApiKey],
        },
        oneTimeToken,
        reqData: {
            input_value: requestModel.message,
            input_type: requestModel.inputType,
            output_type: requestModel.outputType,
            session: sessionId,
            session_id: sessionId,
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
