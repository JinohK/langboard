/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import EHttpStatus from "@/core/helpers/EHttpStatus";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext } from "@/core/providers/SocketProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { useChat as useBaseChat } from "@ai-sdk/react";
import { generateToken } from "@/core/utils/StringUtils";

export interface IUseChat {
    socket: ISocketContext;
    eventKey: string;
    events: {
        abort: string;
        send: string;
        stream: string;
    };
    commonEventData?: Record<string, any>;
}

export const useChat = (props: IUseChat) => {
    const { socket, events, commonEventData } = props;
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const abort = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const chat = useBaseChat({
        id: "editor",
        fetch: async (_, init) => {
            if (!TypeUtils.isString(init?.body)) {
                return new Response("Invalid request", { status: EHttpStatus.HTTP_400_BAD_REQUEST });
            }

            const body = JSON.parse(init.body);

            abortControllerRef.current = new AbortController();

            const key = generateToken(8);

            const stream = createStream({
                ...props,
                signal: abortControllerRef.current.signal,
                key,
                send: () => {
                    socket.send({
                        topic: ESocketTopic.None,
                        eventName: events.send,
                        data: {
                            ...body,
                            ...(commonEventData ?? {}),
                            key,
                        },
                    });
                },
            });

            return new Response(stream, {
                headers: {
                    Connection: "keep-alive",
                    "Content-Type": "text/plain",
                },
            });
        },
    });

    return {
        ...chat,
        abort,
    };
};

interface ICreateStreamProps extends Pick<IUseChat, "socket" | "eventKey" | "events"> {
    signal: AbortSignal;
    key: string;
    send: () => void;
}

const createStream = ({ socket, eventKey, events, signal, key, send }: ICreateStreamProps) => {
    const encoder = new TextEncoder();

    return new ReadableStream({
        async start(controller) {
            const stream = new Promise((resolve) => {
                const chatEventKey = `plate-chat-${eventKey}:${key}`;
                const streamStart = () => {};
                const abortHandler = () => {
                    socket.send({
                        topic: ESocketTopic.None,
                        eventName: events.abort,
                        data: { key },
                    });
                    controller.error(new Error("Stream aborted"));
                };

                signal?.addEventListener("abort", abortHandler);

                const streamBuffer = (data: { message: string }) => {
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(data.message)}\n`));
                };
                const streamEnd = (data: { message: string }) => {
                    const endData = {
                        finishReason: "stop",
                        usage: {
                            promptTokens: 0,
                            completionTokens: data.message.length,
                        },
                    };

                    if (!data.message.length) {
                        endData.finishReason = "error";
                    }

                    controller.enqueue(`d:${JSON.stringify(endData)}\n`);
                    socket.streamOff({
                        topic: ESocketTopic.None,
                        eventKey: chatEventKey,
                        event: events.stream,
                        callbacks: {
                            start: streamStart,
                            buffer: streamBuffer,
                            end: streamEnd,
                        },
                    });
                    resolve(undefined);
                };

                socket.stream({
                    topic: ESocketTopic.None,
                    eventKey: chatEventKey,
                    event: events.stream,
                    callbacks: {
                        start: streamStart,
                        buffer: streamBuffer,
                        end: streamEnd,
                    },
                });

                send();
            });

            await stream;

            controller.close();
        },
    });
};
