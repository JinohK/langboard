import ESocketTopic, { GLOBAL_TOPIC_ID } from "@/core/server/ESocketTopic";
import Subscription from "@/core/server/Subscription";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    return context.client.user.is_admin && context.topicId === GLOBAL_TOPIC_ID;
});
