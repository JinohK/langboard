import Subscription from "@/core/server/Subscription";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import { ESocketTopic } from "@langboard/core/enums";

Subscription.registerValidator(ESocketTopic.BoardCard, async (context) => {
    return await ProjectAssignedUser.isAssignedByCard(context.client.user.id, context.topicId);
});
