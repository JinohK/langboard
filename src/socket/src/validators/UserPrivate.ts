import ESocketTopic from "@/core/socket/ESocketTopic";
import Subscription from "@/core/socket/Subscription";

Subscription.registerValidator(ESocketTopic.UserPrivate, async (context) => {
    return context.client.user.uid === context.topicId;
});
