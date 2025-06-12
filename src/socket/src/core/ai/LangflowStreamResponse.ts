import JsonUtils from "@/core/utils/JsonUtils";
import TypeUtils from "@/core/utils/TypeUtils";
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
            headers,
            responseType: "stream",
            timeout: 120000,
            signal,
        });

        const bufferedChunks: string[] = [];
        const textDecoder = new TextDecoder();
        result.data.on("data", async (chunk) => {
            if (signal && signal.aborted) {
                await onEnd();
                onEndCallback?.();
                return;
            }

            const chunkString = textDecoder.decode(chunk);
            if (!chunkString.trim()) {
                return;
            }

            const splitChunks = chunkString.split("\n\n");
            for (let i = 0; i < splitChunks.length; ++i) {
                const chunk = splitChunks[i];
                if (!chunk.endsWith("}")) {
                    bufferedChunks.push(chunk);
                    continue;
                }

                let jsonChunk: Record<string, any>;
                try {
                    jsonChunk = JsonUtils.Parse(`${bufferedChunks.join("")}${chunk}`);
                } catch (e) {
                    bufferedChunks.push(chunk);
                    continue;
                }

                bufferedChunks.splice(0);

                const parsedMessage = parseLangflowResponse(jsonChunk, result.data);
                if (parsedMessage) {
                    if (parsedMessage === true) {
                        await onEnd();
                        onEndCallback?.();
                        return;
                    }

                    await onMessage(parsedMessage);
                }
            }
        });

        result.data.on("end", async () => {
            if ((!signal || !signal.aborted) && bufferedChunks.length) {
                const allString = bufferedChunks.splice(0).join("");
                let jsonChunk: Record<string, any>;
                try {
                    jsonChunk = JsonUtils.Parse(allString);
                } catch (e) {
                    return;
                }

                const parsedMessage = parseLangflowResponse(jsonChunk, result.data);
                if (TypeUtils.isString(parsedMessage)) {
                    await onMessage(parsedMessage);
                }
            }

            await onEnd();
            onEndCallback?.();
        });

        result.data.on("error", async (error) => {
            await onError?.(error);
            onEndCallback?.();
        });
    };
};

const parseLangflowResponse = (response: Record<string, any>, stream: NodeJS.ReadableStream): string | true | undefined => {
    if (!response.event || !response.data) {
        return undefined;
    }

    const { event, data } = response;

    switch (event) {
        case "add_message":
            if (data.sender && data.sender.toLowerCase() === "user") {
                return undefined;
            } else {
                return data.text;
            }
        case "token":
            if (data.token) {
                return data.chunk;
            }
            break;
        case "end":
            stream.removeAllListeners("data");
            stream.removeAllListeners("end");
            stream.removeAllListeners("error");
            stream.readable = false;
            return true;
    }

    return undefined;
};

export default langflowStreamResponse;
