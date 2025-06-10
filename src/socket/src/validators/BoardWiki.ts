import ESocketTopic from "@/core/server/ESocketTopic";
import Subscription from "@/core/server/Subscription";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    return ProjectAssignedUser.isAssigned(context.client.user.id, context.topicId);
});
