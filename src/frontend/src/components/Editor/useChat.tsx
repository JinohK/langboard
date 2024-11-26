"use client";

import EHttpStatus from "@/core/helpers/EHttpStatus";
import { IConnectedSocket } from "@/core/providers/SocketProvider";
import TypeUtils from "@/core/utils/TypeUtils";
import { useChat as useBaseChat } from "ai/react";

export interface IUseChat {
    socket: IConnectedSocket;
    events: {
        send: string;
        stream: string;
    };
}

export const useChat = ({ socket, events }: IUseChat) => {
    return useBaseChat({
        id: "editor",
        fetch: async (_, init) => {
            if (!TypeUtils.isString(init?.body)) {
                return new Response("Invalid request", { status: EHttpStatus.HTTP_400_BAD_REQUEST });
            }

            const body = JSON.parse(init.body);

            const stream = createStream(socket, events.stream, () => socket.send(events.send, body));

            return new Response(stream, {
                headers: {
                    Connection: "keep-alive",
                    "Content-Type": "text/plain",
                },
            });
        },
    });
};

const createStream = (socket: IConnectedSocket, streamEvent: string, send: () => void) => {
    const encoder = new TextEncoder();

    return new ReadableStream({
        async start(controller) {
            const stream = new Promise((resolve) => {
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
                    socket.streamOff(streamEvent, {
                        start: streamStart,
                        buffer: streamBuffer,
                        end: streamEnd,
                    });
                    resolve(undefined);
                };

                socket.stream(streamEvent, {
                    start: streamStart,
                    buffer: streamBuffer,
                    end: streamEnd,
                });

                send();
            });

            await stream;

            controller.close();
        },
    });
};
