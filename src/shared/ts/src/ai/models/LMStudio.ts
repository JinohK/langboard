import { TGetModelOptions } from "@/ai/models/types";
import { Utils } from "@/utils";
import axios from "axios";

export const getLMStudioModels = async ({ values }: TGetModelOptions) => {
    if (!values.base_url) {
        return [];
    }

    const availableModels: string[] = [];
    const baseURL = values.base_url.endsWith("/") ? values.base_url.slice(0, -1) : values.base_url;
    const api = axios.create({
        baseURL,
    });

    try {
        const response = await api.get("/v1/models");

        const models: { id: string }[] = response.data?.data;
        if (!Utils.Type.isArray(models)) {
            return availableModels;
        }

        for (let i = 0; i < models.length; ++i) {
            availableModels.push(models[i].id);
        }
    } catch {
        return availableModels;
    }

    return availableModels;
};
