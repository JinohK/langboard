import Subscription from "@/core/server/Subscription";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import { ESocketTopic } from "@langboard/core/enums";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    return ProjectAssignedUser.isAssigned(context.client.user.id, context.topicId);
});
