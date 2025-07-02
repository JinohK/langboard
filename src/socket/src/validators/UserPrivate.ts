import Subscription from "@/core/server/Subscription";
import { ESocketTopic } from "@langboard/core/enums";

Subscription.registerValidator(ESocketTopic.UserPrivate, async (context) => {
    return context.client.user.uid === context.topicId;
});
