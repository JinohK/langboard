import Subscription from "@/core/server/Subscription";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";
import { ESocketTopic } from "@langboard/core/enums";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    if (context.client.user.uid === context.topicId) {
        // Disallow user to subscribe to themselves
        return false;
    }

    if (context.client.user.is_admin) {
        return true;
    }

    return await ProjectAssignedUser.isUserRelatedToOtherUser(context.client.user.id, context.topicId);
});
