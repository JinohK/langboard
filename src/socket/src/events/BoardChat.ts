import BotRunner from "@/core/ai/BotRunner";
import EInternalBotType from "@/core/ai/EInternalBotType";
import SnowflakeID from "@/core/db/SnowflakeID";
import ESocketStatus from "@/core/server/ESocketStatus";
import ESocketTopic from "@/core/server/ESocketTopic";
import EventManager from "@/core/server/EventManager";
import TypeUtils from "@/core/utils/TypeUtils";
import ChatHistory from "@/models/ChatHistory";

EventManager.on(ESocketTopic.Board, "board:chat:available", async ({ client, topicId }) => {
    let isAvailable;
    try {
        isAvailable = await BotRunner.isAvailable(EInternalBotType.ProjectChat);
    } catch {
        isAvailable = false;
    }

    let apiBot = null;
    if (isAvailable) {
        apiBot = {
            bot_type: EInternalBotType.ProjectChat,
            display_name: EInternalBotType.ProjectChat,
            avatar: null,
        };
    }

    client.send({
        topic: ESocketTopic.Board,
        topic_id: topicId,
        event: "board:chat:available",
        data: { available: isAvailable, bot: apiBot },
    });
});

EventManager.on(ESocketTopic.Board, "board:chat:send", async ({ client, topicId, data }) => {
    const { message, file_path, task_id } = data ?? {};
    if (!TypeUtils.isString(message) || !TypeUtils.isString(task_id)) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid message data", false);
        return;
    }

    const response = await BotRunner.runAbortable(EInternalBotType.ProjectChat, task_id, {
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

    const isAborted = BotRunner.createAbortedChecker(EInternalBotType.ProjectChat, client, task_id, {
        event: "board:chat:cancelled",
        topic: ESocketTopic.Board,
        topic_id: topicId,
        data: {},
    });

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

    if (TypeUtils.isString(response)) {
        aiMessage.message = { content: response };
        await stream.buffer((data = { uid: aiMessageUID, message: aiMessage.message }));
    } else {
        const newContent = { content: "" };
        let isReceived = false;
        let lastContent: string | undefined = undefined;

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
                    await stream.buffer((data = { uid: aiMessageUID, chunk: updatedContent }));
                    lastContent = newContent.content;
                }
            },
            onError: async (error) => {
                if (isAborted()) {
                    return;
                }
                await stream.end((data = { uid: aiMessageUID, status: "failed", error: error.message }));
                aiMessage.remove();
            },
            onEnd: async () => {
                aiMessage.message = newContent;
                if (!isReceived) {
                    if (!isAborted()) {
                        await aiMessage.remove();
                        await stream.end((data = { uid: aiMessageUID, status: "failed" }));
                        return;
                    }
                }

                await ChatHistory.update(aiMessage.id, { message: newContent });
                await stream.end((data = { uid: aiMessageUID, status: "success" }));
            },
        });
    }
});

EventManager.on(ESocketTopic.Board, "board:chat:cancel", async ({ client, data }) => {
    const { task_id } = data ?? {};
    if (!TypeUtils.isString(task_id)) {
        client.sendError(ESocketStatus.WS_4001_INVALID_DATA, "Invalid task ID", false);
        return;
    }

    await BotRunner.abort(EInternalBotType.ProjectChat, task_id);
});
