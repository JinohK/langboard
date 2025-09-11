/* eslint-disable @typescript-eslint/no-explicit-any */
import { Utils } from "@/utils";
import axios from "axios";

export const getOllamaModels = async (values: Record<string, any>) => {
    if (!values.base_url) {
        return [];
    }

    const availableModels: string[] = [];
    const baseURL = values.base_url.endsWith("/") ? values.base_url.slice(0, -1) : values.base_url;
    const api = axios.create({
        baseURL,
    });
    try {
        const response = await api.get("/api/tags");

        const models: { name: string }[] = response.data?.models;
        if (!Utils.Type.isArray(models)) {
            return availableModels;
        }

        for (let i = 0; i < models.length; ++i) {
            const modelName = models[i].name;

            try {
                const modelResponse = await api.post("/api/show", {
                    model: modelName,
                });

                const capabilities: string[] = modelResponse.data?.capabilities;
                if (!Utils.Type.isArray(capabilities)) {
                    continue;
                }

                if (capabilities.includes("completion")) {
                    availableModels.push(modelName);
                }
            } catch {
                continue;
            }
        }
    } catch {
        return availableModels;
    }

    return availableModels;
};
