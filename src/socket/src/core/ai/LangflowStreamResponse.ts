import JsonUtils from "@/core/utils/JsonUtils";
import axios from "axios";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getLangflowOutputMessage = (response: Record<string, any>): string | undefined => {
    try {
        let responseOutputs = response.outputs[0];
        while (!responseOutputs.messages) {
            responseOutputs = responseOutputs.outputs[0];
        }
        return responseOutputs.messages[0].message;
    } catch {
        return undefined;
    }
};

interface ILangflowStreamResponseParams {
    url: string;
    headers?: Record<string, any>;
    body: Record<string, any>;
    signal?: AbortSignal;
    onEnd?: () => void;
}

const langflowStreamResponse = ({ url, headers, body, signal, onEnd: onEndCallback }: ILangflowStreamResponseParams) => {
    return async ({
        onMessage,
        onEnd,
        onError,
    }: {
        onMessage: (message: string) => void | Promise<void>;
        onEnd: () => void | Promise<void>;
        onError?: (error: Error) => void | Promise<void>;
    }) => {
        if (signal && signal.aborted) {
            return;
        }

        const result = await axios.post<NodeJS.ReadableStream>(url, body, {
            headers: headers,
            responseType: "stream",
            signal,
        });

        result.data.on("data", async (chunk) => {
            if (signal && signal.aborted) {
                return;
            }

            const chunkString = chunk.toString();
            if (!chunkString.trim()) {
                return;
            }

            let jsonChunk;
            try {
                jsonChunk = JsonUtils.Parse(chunkString);
            } catch {
                return;
            }

            if (!jsonChunk.event || !jsonChunk.data) {
                return;
            }

            const { event, data } = jsonChunk;

            if (event === "add_message") {
                if (data.sender && data.sender.toLowerCase() === "user") {
                    return;
                } else {
                    await onMessage(data.text);
                }
            } else if (event === "token") {
                if (data.token) {
                    await onMessage(data.chunk);
                }
            }
        });

        result.data.on("end", async () => {
            await onEnd();
            onEndCallback?.();
        });

        result.data.on("error", async (error) => {
            await onError?.(error);
            onEndCallback?.();
        });
    };
};

export default langflowStreamResponse;
