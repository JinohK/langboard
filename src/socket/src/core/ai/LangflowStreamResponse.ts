import { api } from "@/core/helpers/Api";
import Logger from "@/core/utils/Logger";
import { Utils } from "@langboard/core/utils";

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
        if (signal?.aborted) {
            return;
        }

        try {
            const result = await api.post<NodeJS.ReadableStream>(url, body, {
                headers,
                responseType: "stream",
                signal,
            });

            const bufferedChunks: string[] = [];
            const textDecoder = new TextDecoder();

            let isEndedGracefully = false;
            const endStream = async (error?: Error) => {
                isEndedGracefully = true;
                if (!signal?.aborted && !error && bufferedChunks.length) {
                    const allString = bufferedChunks.splice(0).join("");
                    let jsonChunk: Record<string, any>;
                    try {
                        jsonChunk = Utils.Json.Parse(allString);
                    } catch (e) {
                        return;
                    }

                    const parsedMessage = parseLangflowResponse(jsonChunk);
                    if (Utils.Type.isString(parsedMessage)) {
                        await onMessage(parsedMessage);
                    }
                }

                bufferedChunks.splice(0);

                if (error) {
                    if (!signal?.aborted) {
                        await onError?.(error);
                    }
                } else {
                    await onEnd();
                }
                onEndCallback?.();

                result.data.removeAllListeners("data");
                result.data.removeAllListeners("end");
                result.data.removeAllListeners("error");
            };

            if (signal) {
                const abortEvent = async () => {
                    await endStream();
                    signal.removeEventListener("abort", abortEvent);
                };

                signal.addEventListener("abort", abortEvent);
            }

            result.data
                .on("data", async (chunk) => {
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
                            jsonChunk = Utils.Json.Parse(`${bufferedChunks.join("")}${chunk}`);
                        } catch (e) {
                            bufferedChunks.push(chunk);
                            continue;
                        }

                        bufferedChunks.splice(0);

                        const parsedMessage = parseLangflowResponse(jsonChunk);
                        if (Utils.Type.isUndefined(parsedMessage)) {
                            continue;
                        }

                        if (Utils.Type.isString(parsedMessage)) {
                            await onMessage(parsedMessage);
                            continue;
                        }

                        if (Utils.Type.isObject(parsedMessage) && parsedMessage.error) {
                            await endStream(new Error(`Langflow stream error: ${parsedMessage.error}`));
                            break;
                        }

                        await endStream();
                        break;
                    }
                })
                .on("end", endStream)
                .on("error", endStream)
                .on("close", async () => {
                    result.data.removeAllListeners("close");
                    if (isEndedGracefully) {
                        return;
                    }

                    await endStream();
                });
        } catch (error) {
            Logger.error(error);
            if (signal?.aborted) {
                return;
            }

            await onError?.(
                Utils.Type.isError(error) ? error : new Error("An unknown error occurred while processing the Langflow stream response.")
            );
            onEndCallback?.();
        }
    };
};

const parseLangflowResponse = (response: Record<string, any>): string | true | { error: any } | undefined => {
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
        case "error":
            return { error: data };
        case "end":
            return true;
    }

    return undefined;
};

export default langflowStreamResponse;
