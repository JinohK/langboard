import EventManager from "@/core/server/EventManager";
import { ESocketTopic } from "@langboard/core/enums";
import { getBotStatusMap } from "@/core/ai/requests/utils";
import { SocketEvents } from "@langboard/core/constants";

EventManager.on(ESocketTopic.Board, SocketEvents.CLIENT.BOARD.BOT.STATUS_MAP, async ({ client, topicId }) => {
    const botStatusMap = await getBotStatusMap();

    client.send({
        event: SocketEvents.SERVER.BOARD.BOT.STATUS_MAP,
        topic: ESocketTopic.Board,
        topic_id: topicId,
        data: { bot_status_map: botStatusMap },
    });
});
