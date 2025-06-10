import ESocketTopic from "@/core/server/ESocketTopic";
import Subscription from "@/core/server/Subscription";

Subscription.registerValidator(ESocketTopic.UserPrivate, async (context) => {
    return context.client.user.uid === context.topicId;
});
