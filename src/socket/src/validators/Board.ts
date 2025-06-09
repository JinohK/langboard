import ESocketTopic from "@/core/socket/ESocketTopic";
import Subscription from "@/core/socket/Subscription";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    return await ProjectAssignedUser.isAssigned(context.client.user.id, context.topicId);
});
