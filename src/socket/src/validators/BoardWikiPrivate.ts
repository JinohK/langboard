import ESocketTopic from "@/core/socket/ESocketTopic";
import Subscription from "@/core/socket/Subscription";
import ProjectWiki from "@/models/ProjectWiki";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    return await ProjectWiki.isAssigned(context.client.user.id, context.topicId);
});
