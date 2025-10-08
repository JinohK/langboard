/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_URL } from "@/Constants";
import { DATA_TEXT_FORMAT_DESCRIPTIONS } from "@/core/utils/EditorUtils";

export enum ELangflowConstants {
    ApiKey = "x-api-key",
}

abstract class BaseLangflowComponent {
    public abstract toTweaks(): Record<string, any>;
    public abstract toData(): Record<string, any>;
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
            base_url: API_URL,
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

    public toTweaks(): Record<string, any> {
        return { LangboardCalledVariablesComponent: this.toData() };
    }

    public toData(): Record<string, any> {
        return { ...this.#model };
    }
}
