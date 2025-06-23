import BotRunner from "@/core/ai/BotRunner";
import ESocketStatus from "@/core/server/ESocketStatus";
import ESocketTopic, { NONE_TOPIC_ID } from "@/core/server/ESocketTopic";
import EventManager, { TEventContext } from "@/core/server/EventManager";
import TypeUtils from "@/core/utils/TypeUtils";
import InternalBot, { EInternalBotType } from "@/models/InternalBot";
import ProjectAssignedInternalBot from "@/models/ProjectAssignedInternalBot";

interface IEditorEventRegistryParams {
    eventPrefix: string;
    chatType: EInternalBotType;
    copilotType: EInternalBotType;
    getInternalBot: (botType: EInternalBotType, context: TEventContext) => Promise<InternalBot | null>;
}

const registerEditorEvents = ({ eventPrefix, chatType, copilotType, getInternalBot }: IEditorEventRegistryParams) => {
    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:chat:send`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !TypeUtils.isString(task_id)) {
            return;
        }

        const internalBot = await getInternalBot(chatType, context);
        if (!internalBot) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "No chat bot available for this project", false);
            return;
        }

        const response = await BotRunner.runAbortable(internalBot, task_id, {
            ...context.data,
            user_id: context.client.user.id,
        });

        const stream = context.client.stream(ESocketTopic.None, NONE_TOPIC_ID, `${eventPrefix}:editor:chat:stream`);
        stream.start();
        let message = "";
        if (!response) {
            stream.end({ message: "" });
            return;
        }

        if (TypeUtils.isString(response)) {
            stream.buffer({ message: response });
            message = response;
            stream.end({ message });
            return;
        }

        const isAborted = BotRunner.createAbortedChecker(chatType, task_id);
        if (isAborted()) {
            return;
        }

        let newContent = "";
        let lastContent: string | undefined = undefined;

        await response({
            onMessage: (chunk) => {
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
                stream.end({ status: "failed", message: error.message });
            },
            onEnd: () => {
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

        await BotRunner.abort(chatType, task_id, context.client);
    });

    EventManager.on(ESocketTopic.None, `${eventPrefix}:editor:copilot:send`, async (context) => {
        const { task_id } = context.data ?? {};
        if (!context.data || !TypeUtils.isString(task_id)) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
            return;
        }

        const internalBot = await getInternalBot(copilotType, context);
        if (!internalBot) {
            context.client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "No chat bot available for this project", false);
            return;
        }

        const response = await BotRunner.runAbortable(internalBot, task_id, {
            ...context.data,
        });

        const sharedData = {
            topic: ESocketTopic.None,
            topic_id: NONE_TOPIC_ID,
            event: `${eventPrefix}:editor:copilot:receive:${task_id}`,
        };

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

        const isAborted = BotRunner.createAbortedChecker(copilotType, task_id);
        if (isAborted()) {
            return;
        }

        let message = "";
        await response({
            onMessage: (data) => {
                message = `${message}${data}`;
            },
            onError: () => {
                context.client.send({
                    ...sharedData,
                    data: { text: "0" },
                });
            },
            onEnd: () => {
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

        await BotRunner.abort(chatType, task_id, context.client);
    });
};

interface IEditorType {
    type: string;
    getInternalBot: (botType: EInternalBotType, context: TEventContext) => Promise<InternalBot | null>;
}

const EDITOR_TYPES: IEditorType[] = [
    {
        type: "board:card",
        getInternalBot: async (botType, context) =>
            !TypeUtils.isString(context.data.project_uid)
                ? null
                : await ProjectAssignedInternalBot.getInternalBotByProjectUID(botType, context.data.project_uid),
    },
    {
        type: "board:wiki",
        getInternalBot: async (botType, context) =>
            !TypeUtils.isString(context.data.project_uid)
                ? null
                : await ProjectAssignedInternalBot.getInternalBotByProjectUID(botType, context.data.project_uid),
    },
];

for (let i = 0; i < EDITOR_TYPES.length; ++i) {
    const { type, getInternalBot } = EDITOR_TYPES[i];
    registerEditorEvents({
        eventPrefix: type,
        chatType: EInternalBotType.EditorChat,
        copilotType: EInternalBotType.EditorCopilot,
        getInternalBot,
    });
}
