import ESocketTopic from "@/core/server/ESocketTopic";
import Subscription from "@/core/server/Subscription";
import ProjectAssignedBot from "@/models/ProjectAssignedBot";
import ProjectAssignedUser from "@/models/ProjectAssignedUser";

Subscription.registerValidator(ESocketTopic.User, async (context) => {
    if (!context.topicId.includes("-")) {
        return false;
    }

    const [botUID, projectUID] = context.topicId.split("-");
    if (!botUID || !projectUID) {
        return false;
    }

    if (!(await ProjectAssignedUser.isAssigned(context.client.user.id, projectUID))) {
        return false;
    }

    if (!(await ProjectAssignedBot.isAssigned(botUID, projectUID))) {
        return false;
    }

    return true;
});
