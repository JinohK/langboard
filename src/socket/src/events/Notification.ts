import EventManager from "@/core/server/EventManager";
import { Utils } from "@langboard/core/utils";
import { ESocketTopic } from "@langboard/core/enums";
import UserNotification from "@/models/UserNotification";

EventManager.on(ESocketTopic.None, "user:notification:read", async (context) => {
    if (!context.data || !Utils.Type.isString(context.data.uid)) {
        return;
    }

    await UserNotification.read(context.data.uid, context.client.user.id);
});

EventManager.on(ESocketTopic.None, "user:notification:read-all", async (context) => {
    await UserNotification.readAll(context.client.user.id);
});

EventManager.on(ESocketTopic.None, "user:notification:delete", async (context) => {
    if (!context.data || !Utils.Type.isString(context.data.uid)) {
        return;
    }

    await UserNotification.deleteByUID(context.data.uid, context.client.user.id);
});

EventManager.on(ESocketTopic.None, "user:notification:delete-all", async (context) => {
    await UserNotification.deleteAll(context.client.user.id);
});
