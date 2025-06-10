import ESocketTopic from "@/core/server/ESocketTopic";
import Subscription from "@/core/server/Subscription";
import ProjectWiki from "@/models/ProjectWiki";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    return await ProjectWiki.isAssigned(context.client.user.id, context.topicId);
});
