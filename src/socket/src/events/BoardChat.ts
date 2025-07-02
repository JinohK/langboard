import BotRunner from "@/core/ai/BotRunner";
import SnowflakeID from "@/core/db/SnowflakeID";
import EventManager from "@/core/server/EventManager";
import { Utils } from "@langboard/core/utils";
import { ESocketStatus, ESocketTopic } from "@langboard/core/enums";
import ChatHistory from "@/models/ChatHistory";
import { EInternalBotType } from "@/models/InternalBot";
import ProjectAssignedInternalBot from "@/models/ProjectAssignedInternalBot";

EventManager.on(ESocketTopic.Board, "board:chat:available", async ({ client, topicId }) => {
    const internalBot = await ProjectAssignedInternalBot.getInternalBotByProjectUID(EInternalBotType.ProjectChat, topicId);
    let isAvailable = false;
    if (internalBot) {
        try {
            isAvailable = await BotRunner.isAvailable(internalBot);
        } catch {
            isAvailable = false;
        }
    }

    const apiBot = internalBot?.apiResponse ?? null;

    client.send({
        topic: ESocketTopic.Board,
        topic_id: topicId,
        event: "board:chat:available",
        data: { available: isAvailable, bot: apiBot },
    });
});

EventManager.on(ESocketTopic.Board, "board:chat:send", async ({ client, topicId, data }) => {
    const { message, file_path, task_id } = data ?? {};
    if (!Utils.Type.isString(message) || !Utils.Type.isString(task_id)) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid message data", false);
        return;
    }

    const internalBot = await ProjectAssignedInternalBot.getInternalBotByProjectUID(EInternalBotType.ProjectChat, topicId);
    if (!internalBot) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "No chat bot available for this project", false);
        return;
    }

    const response = await BotRunner.runAbortable(internalBot, task_id, {
        message,
        file_path,
        project_uid: topicId,
        user_id: client.user.id,
    });

    if (!response) {
        client.send({
            event: "board:chat:available",
            topic: ESocketTopic.Board,
            topic_id: topicId,
        });
        return;
    }

    const isAborted = BotRunner.createAbortedChecker(EInternalBotType.ProjectChat, task_id);
    if (isAborted()) {
        return;
    }

    const userMessage = await ChatHistory.create({
        filterable_table: "project",
        filterable_id: SnowflakeID.fromShortCode(topicId).toString(),
        sender_id: client.user.id,
        message: { content: message },
    }).save();

    if (isAborted()) {
        return;
    }

    client.send({
        event: "board:chat:sent",
        topic: ESocketTopic.Board,
        topic_id: topicId,
        data: { user_message: userMessage.apiResponse },
    });

    if (isAborted()) {
        return;
    }

    const stream = client.stream(ESocketTopic.Board, topicId, "board:chat:stream");
    const aiMessage = await ChatHistory.create({
        filterable_table: userMessage.filterable_table,
        filterable_id: userMessage.filterable_id,
        receiver_id: client.user.id,
        message: { content: "" },
    }).save();
    const aiMessageUID = new SnowflakeID(aiMessage.id).toShortCode();

    stream.start({ ai_message: aiMessage.apiResponse });

    if (isAborted()) {
        return;
    }

    if (Utils.Type.isString(response)) {
        aiMessage.message = { content: response };
        stream.buffer({ uid: aiMessageUID, message: aiMessage.message });
        stream.end({ uid: aiMessageUID, status: "success" });
        await aiMessage.save();
        return;
    }

    const newContent = { content: "" };
    let isReceived = false;
    let lastContent: string | undefined = undefined;

    const saveMessage = async () => {
        await ChatHistory.update(aiMessage.id, {
            message: newContent,
        });
    };

    await response({
        onMessage: async (chunk) => {
            isReceived = true;
            const oldContent = newContent.content;
            let updatedContent = "";
            if (chunk) {
                if (oldContent) {
                    newContent.content = chunk.startsWith(oldContent) ? chunk : `${oldContent}${chunk}`;
                    updatedContent = chunk.split(oldContent, 2).pop() || chunk;
                } else {
                    newContent.content = chunk;
                    updatedContent = chunk;
                }
            }

            if (lastContent !== newContent.content) {
                stream.buffer({ uid: aiMessageUID, chunk: updatedContent });
                lastContent = newContent.content;
            }
        },
        onError: async (error) => {
            stream.end({ uid: aiMessageUID, status: "failed", error: error.message });
            await aiMessage.remove();
        },
        onEnd: async () => {
            if (!isReceived) {
                if (!isAborted()) {
                    stream.end({ uid: aiMessageUID, status: "failed" });
                    await aiMessage.remove();
                }

                return;
            }

            stream.end({ uid: aiMessageUID, status: isAborted() ? "aborted" : "success" });
            await saveMessage();
        },
    });
});

EventManager.on(ESocketTopic.Board, "board:chat:cancel", async ({ client, data }) => {
    const { task_id } = data ?? {};
    if (!Utils.Type.isString(task_id)) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
        return;
    }

    await BotRunner.abort(EInternalBotType.ProjectChat, task_id, client);
});
