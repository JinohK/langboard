/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import EHttpStatus from "@/core/helpers/EHttpStatus";
import ESocketTopic from "@/core/helpers/ESocketTopic";
import { ISocketContext } from "@/core/providers/SocketProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { useChat as useBaseChat } from "ai/react";

export interface IUseChat {
    socket: ISocketContext;
    eventKey: string;
    events: {
        send: string;
        stream: string;
    };
    commonEventData?: Record<string, any>;
}

export const useChat = ({ socket, eventKey, events, commonEventData }: IUseChat) => {
    return useBaseChat({
        id: "editor",
        fetch: async (_, init) => {
            if (!TypeUtils.isString(init?.body)) {
                return new Response("Invalid request", { status: EHttpStatus.HTTP_400_BAD_REQUEST });
            }

            const body = JSON.parse(init.body);

            const stream = createStream(socket, eventKey, events.stream, () => {
                socket.send({
                    topic: ESocketTopic.None,
                    eventName: events.send,
                    data: {
                        ...body,
                        ...(commonEventData ?? {}),
                    },
                });
            });

            return new Response(stream, {
                headers: {
                    Connection: "keep-alive",
                    "Content-Type": "text/plain",
                },
            });
        },
    });
};

const createStream = (socket: ISocketContext, eventKey: string, streamEvent: string, send: () => void) => {
    const encoder = new TextEncoder();

    return new ReadableStream({
        async start(controller) {
            const stream = new Promise((resolve) => {
                const chatEventKey = `plate-chat-${eventKey}`;
                const streamStart = () => {};
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
                        event: streamEvent,
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
                    event: streamEvent,
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
