import ESocketTopic from "@/core/socket/ESocketTopic";
import EventManager from "@/core/socket/EventManager";
import TypeUtils from "@/core/utils/TypeUtils";
import UserNotification from "@/models/UserNotification";

EventManager.on(ESocketTopic.None, "user:notification:read", async (context) => {
    console.log(context);
    if (!context.data || !TypeUtils.isString(context.data.uid)) {
        return;
    }

    await UserNotification.read(context.data.uid, context.client.user.id);
});

EventManager.on(ESocketTopic.None, "user:notification:read-all", async (context) => {
    await UserNotification.readAll(context.client.user.id);
});

EventManager.on(ESocketTopic.None, "user:notification:delete", async (context) => {
    if (!context.data || !TypeUtils.isString(context.data.uid)) {
        return;
    }

    await UserNotification.deleteByUID(context.data.uid, context.client.user.id);
});

EventManager.on(ESocketTopic.None, "user:notification:delete-all", async (context) => {
    await UserNotification.deleteAll(context.client.user.id);
});
