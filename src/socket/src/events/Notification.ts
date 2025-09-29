import EventManager from "@/core/server/EventManager";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";
import UserNotification from "@/models/UserNotification";
import { SocketEvents } from "@langboard/core/constants";

EventManager.on(ESocketTopic.None, SocketEvents.CLIENT.USER.READ_NOTIFICATION, async (context) => {
    if (!context.data || !Utils.Type.isString(context.data.uid)) {
        return;
    }

    await UserNotification.read(context.data.uid, context.client.user.id);
});

EventManager.on(ESocketTopic.None, SocketEvents.CLIENT.USER.READ_ALL_NOTIFICATIONS, async (context) => {
    await UserNotification.readAll(context.client.user.id);
});

EventManager.on(ESocketTopic.None, SocketEvents.CLIENT.USER.DELETE_NOTIFICATION, async (context) => {
    if (!context.data || !Utils.Type.isString(context.data.uid)) {
        return;
    }

    await UserNotification.deleteByUID(context.data.uid, context.client.user.id);
});

EventManager.on(ESocketTopic.None, SocketEvents.CLIENT.USER.DELETE_ALL_NOTIFICATIONS, async (context) => {
    await UserNotification.deleteAll(context.client.user.id);
});
