import Subscription from "@/core/server/Subscription";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import { ESocketTopic } from "@langboard/core/enums";

Subscription.registerValidator(ESocketTopic.Dashboard, async (context) => {
    return await ProjectAssignedUser.isAssigned(context.client.user.id, context.topicId);
});
