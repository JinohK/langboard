import Subscription from "@/core/server/Subscription";
import { ESocketTopic, GLOBAL_TOPIC_ID } from "@langboard/core/enums";

Subscription.registerValidator(ESocketTopic.AppSettings, async (context) => {
    return context.client.user.is_admin && context.topicId === GLOBAL_TOPIC_ID;
});
