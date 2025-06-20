import BotRunner from "@/core/ai/BotRunner";
import EInternalBotType from "@/core/ai/EInternalBotType";
import ESocketStatus from "@/core/server/ESocketStatus";
import ESocketTopic, { NONE_TOPIC_ID } from "@/core/server/ESocketTopic";
import EventManager from "@/core/server/EventManager";
import TypeUtils from "@/core/utils/TypeUtils";

interface IEditorEventRegistryParams {
    eventPrefix: string;
    chatType: EInternalBotType;
    copilotType: EInternalBotType;
}

const registerEditorEvents = ({ eventPrefix, chatType, copilotType }: IEditorEventRegistryParams) => {
    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:chat:send`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !TypeUtils.isString(task_id)) {
            return;
        }

        const response = await BotRunner.runAbortable(chatType, task_id, {
            ...context.data,
            user_id: context.client.user.id,
        });

        const isAborted = BotRunner.createAbortedChecker(chatType, context.client, task_id, {
            event: `${eventPrefix}:editor:chat:abort:${task_id}`,
            topic: ESocketTopic.None,
            topic_id: NONE_TOPIC_ID,
            data: { text: "0" },
        });

        if (isAborted()) {
            return;
        }

        const stream = context.client.stream(ESocketTopic.None, NONE_TOPIC_ID, `${eventPrefix}:editor:chat:stream`);
        stream.start();
        let message = "";
        if (!response) {
            stream.end({ message: "" });
            return;
        }

        if (isAborted()) {
            return;
        }

        if (TypeUtils.isString(response)) {
            stream.buffer({ message: response });
            message = response;
            stream.end({ message });
            return;
        }

        let newContent = "";
        let isReceived = false;
        let lastContent: string | undefined = undefined;

        await response({
            onMessage: (chunk) => {
                if (isAborted()) {
                    return;
                }

                isReceived = true;
                const oldContent = newContent;
                let updatedContent = "";
                if (chunk) {
                    if (oldContent) {
                        newContent = chunk.startsWith(oldContent) ? chunk : `${oldContent}${chunk}`;
                        updatedContent = chunk.split(oldContent, 2).pop() || chunk;
                    } else {
                        newContent = chunk;
                        updatedContent = chunk;
                    }
                }

                if (lastContent !== newContent) {
                    stream.buffer({ message: updatedContent });
                    lastContent = newContent;
                }
            },
            onError: (error) => {
                if (isAborted()) {
                    return;
                }
                stream.end({ status: "failed", message: error.message });
            },
            onEnd: () => {
                if (isAborted()) {
                    return;
                }
                stream.end({ message });
            },
        });
    });

    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:chat:abort`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !TypeUtils.isString(task_id)) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
            return;
        }

        await BotRunner.abort(chatType, task_id);
        context.client.send({
            topic: ESocketTopic.None,
            event: `${eventPrefix}:editor:chat:abort:${task_id}`,
            data: { text: "0" },
        });
    });

    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:copilot:send`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !TypeUtils.isString(task_id)) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
            return;
        }

        const response = await BotRunner.runAbortable(copilotType, task_id, {
            ...context.data,
        });

        const isAborted = BotRunner.createAbortedChecker(copilotType, context.client, task_id, {
            event: `${eventPrefix}:editor:copilot:abort:${task_id}`,
            topic: ESocketTopic.None,
            topic_id: NONE_TOPIC_ID,
            data: { text: "0" },
        });

        const sharedData = {
            topic: ESocketTopic.None,
            topic_id: NONE_TOPIC_ID,
            event: `${eventPrefix}:editor:copilot:receive:${task_id}`,
        };

        if (isAborted()) {
            return;
        }

        if (!response) {
            context.client.send({
                ...sharedData,
                data: { text: "0" },
            });
            return;
        }

        if (TypeUtils.isString(response)) {
            context.client.send({
                ...sharedData,
                data: { text: response },
            });
            return;
        }

        let message = "";
        await response({
            onMessage: (data) => {
                if (isAborted()) {
                    return;
                }
                message = `${message}${data}`;
            },
            onError: () => {
                if (isAborted()) {
                    return;
                }
                context.client.send({
                    ...sharedData,
                    data: { text: "0" },
                });
            },
            onEnd: () => {
                if (isAborted()) {
                    return;
                }
                context.client.send({
                    ...sharedData,
                    data: { text: message },
                });
            },
        });
    });

    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:copilot:abort`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !TypeUtils.isString(task_id)) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
            return;
        }

        await BotRunner.abort(chatType, task_id);
        context.client.send({
            topic: ESocketTopic.None,
            event: `${eventPrefix}:editor:copilot:abort:${task_id}`,
            data: { text: "0" },
        });
    });
};

const EDITOR_TYPES = ["board:card", "board:wiki"];

for (let i = 0; i < EDITOR_TYPES.length; ++i) {
    const type = EDITOR_TYPES[i];
    registerEditorEvents({
        eventPrefix: type,
        chatType: EInternalBotType.EditorChat,
        copilotType: EInternalBotType.EditorCopilot,
    });
}
